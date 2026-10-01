'use server';

import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient, getAdminKeyConfigurationError } from '@/lib/supabase/admin';

type DrivePhotoMatch = { fileId: string; menuName: string };
type ExistingMenuItem = { id: string; name: string };

const driveImageMatches: DrivePhotoMatch[] = [
  { fileId: '1sCuJuZz5cCieLsOIg-4cZXzpJ4oimWou', menuName: 'Mie Ayam Spesial Halus' },
  { fileId: '1PuAgqYFtflJOQ2YD4QL8pNHno_ZkOjTt', menuName: 'Mie Ayam Lebar Baso' },
  { fileId: '1RibgLB1afUBK36KmS3deBpu4rF_U--Dp', menuName: 'Mie Ayam Lebar Pangsit Rebus' },
  { fileId: '1mfJ5xm6WKObfYpe_HQExf7pcHtaASmAP', menuName: 'Mie Ayam Spesial Karet' },
  { fileId: '1rDlfsUMmVqoVw0Bn5_zd_zOoy70qigcc', menuName: 'Mie Ayam Katsu Halus' },
  { fileId: '1dj-BQ7DpRpsnL0olmjznbc2NT8841Rpk', menuName: 'Yamin Baso Halus' },
  { fileId: '1Insmb5l32Qd-nlYQj1s7JlDri36nFc5h', menuName: 'Yamin Pangsit Rebus Lebar' },
  { fileId: '1ZWoRRhwUwdZTYBeyzlMS-wWe8nR4TKfP', menuName: 'Yamin Chicken Katsu Karet' },
  { fileId: '159M3sT6zVPFEy2jOA-g3NEYeaaOpPHAk', menuName: 'Yamin Chicken Katsu Lebar' },
  { fileId: '1E2HJo7bNoX6uMUJbwn2Jq59z5-bqvffP', menuName: 'Yamin Spesial Lebar' },
];

const driveHosts = new Set(['drive.google.com', 'drive.usercontent.google.com']);
const maxDriveImageBytes = 5 * 1024 * 1024;
const bucket = 'menu-images';

function back(notice: string): never {
  revalidatePath('/');
  revalidatePath('/admin');
  redirect(`/admin?notice=${encodeURIComponent(notice)}`);
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('id-ID');
}

async function inBatches<T, R>(
  values: T[],
  size: number,
  callback: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let index = 0; index < values.length; index += size) {
    results.push(...(await Promise.all(values.slice(index, index + size).map(callback))));
  }
  return results;
}

async function uploadDriveImage(
  supabase: ReturnType<typeof createAdminClient>,
  fileId: string,
): Promise<string> {
  const response = await fetch(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Gagal mengunduh foto Drive (HTTP ${response.status})`);

  const contentType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase();
  if (response.url.startsWith('https://') === false || !driveHosts.has(new URL(response.url).hostname)) {
    throw new Error('Drive mengalihkan unduhan ke host yang tidak diizinkan');
  }
  if (contentType !== 'image/jpeg') {
    throw new Error(`Format foto Drive tidak didukung: ${contentType ?? 'tidak diketahui'}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > maxDriveImageBytes) {
    throw new Error(`Ukuran foto Drive tidak valid (${bytes.byteLength} byte)`);
  }

  const imageHash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  const path = `google-drive/${fileId}-${imageHash}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    cacheControl: '31536000',
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(`Gagal mengunggah foto menu: ${error.message}`);

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function syncDriveMenuPhotos() {
  await requireAdmin();

  const keyError = getAdminKeyConfigurationError();
  if (keyError) return back(`Konfigurasi Supabase: ${keyError}`);

  let notice: string;
  try {
    const supabase = createAdminClient();
    const menuResult = await supabase.from('menu_items').select('id, name');
    if (menuResult.error) throw new Error(`Gagal membaca menu Supabase: ${menuResult.error.message}`);

    const existingItems = (menuResult.data ?? []) as ExistingMenuItem[];
    const existingByName = new Map<string, ExistingMenuItem>();
    for (const item of existingItems) {
      const key = normalizeName(item.name);
      if (existingByName.has(key)) throw new Error(`Nama menu duplikat di Supabase: ${item.name}`);
      existingByName.set(key, item);
    }

    const matchedItems = driveImageMatches.map((item) => {
      const existing = existingByName.get(normalizeName(item.menuName));
      if (!existing) throw new Error(`Menu "${item.menuName}" tidak ditemukan di Supabase`);
      return { ...item, existing };
    });

    const images = await inBatches(matchedItems, 4, async (item) => {
      const imageUrl = await uploadDriveImage(supabase, item.fileId);
      return { ...item, imageUrl };
    });

    await inBatches(images, 4, async (item) => {
      const result = await supabase
        .from('menu_items')
        .update({ image_url: item.imageUrl })
        .eq('id', item.existing.id);
      if (result.error) throw new Error(`Gagal menyimpan "${item.menuName}": ${result.error.message}`);
    });

    notice = `Sinkronisasi foto Drive selesai: ${images.length} gambar diunggah dan dicocokkan ke menu Supabase. Menu lain tidak diubah.`;
  } catch (error) {
    notice = `Sinkronisasi foto Drive gagal: ${error instanceof Error ? error.message : 'kesalahan tidak diketahui'}`;
  }
  return back(notice);
}
