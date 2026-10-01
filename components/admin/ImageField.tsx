'use client';

import { useState, type ChangeEvent } from 'react';

const MAX_SIDE = 1280;

// Perkecil foto di browser (maks 1280px, JPEG) agar upload cepat dan landing page ringan.
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    return blob ? new File([blob], `${file.name.replace(/\.\w+$/, '')}.jpg`, { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

export default function ImageField({ current }: { current: string | null }) {
  const [preview, setPreview] = useState<string | null>(current);
  const [removed, setRemoved] = useState(false);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    const small = await shrink(file);
    const dt = new DataTransfer();
    dt.items.add(small);
    input.files = dt.files;
    setPreview(URL.createObjectURL(small));
    setRemoved(false);
  }

  return (
    <div className="space-y-2 text-sm font-semibold sm:col-span-2">
      <span>Foto menu</span>
      <input type="hidden" name="image_url" value={removed ? '' : (current ?? '')} />
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-kuah bg-mie/40">
          {preview && !removed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau foto" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs font-normal">Belum ada foto</span>
          )}
        </div>
        <div className="space-y-2">
          <input name="image" type="file" accept="image/*" onChange={onPick} className="block text-sm font-normal" />
          {current && (
            <label className="flex items-center gap-2 font-normal">
              <input type="checkbox" checked={removed} onChange={(e) => setRemoved(e.target.checked)} />
              Hapus foto saat ini
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
