import Hero from '@/components/landing/Hero';
import MenuCatalog from '@/components/landing/MenuCatalog';
import Location from '@/components/landing/Location';
import Testimonials from '@/components/landing/Testimonials';
import Footer from '@/components/landing/Footer';
import { createPublicClient } from '@/lib/supabase/public';
import type { Category, MenuItem } from '@/lib/types';

export const revalidate = 60; // ISR: menu diperbarui maksimal tiap 60 detik (admin juga memicu revalidate)

async function getMenu(): Promise<{ categories: Category[]; items: MenuItem[] }> {
  try {
    const supabase = createPublicClient();
    const [cats, menu] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('name'),
    ]);
    return { categories: (cats.data ?? []) as Category[], items: (menu.data ?? []) as MenuItem[] };
  } catch {
    return { categories: [], items: [] }; // build tetap lolos jika env belum diisi
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ table?: string | string[] }>;
}) {
  const { categories, items } = await getMenu();
  const { table } = await searchParams;
  const tableValue = Array.isArray(table) ? table[0] : table;
  const parsedTable = tableValue ? Number(tableValue) : null;
  const tableNumber =
    parsedTable !== null && Number.isSafeInteger(parsedTable) && parsedTable > 0 ? parsedTable : null;
  
  return (
    <main>
      <Hero />
      <MenuCatalog categories={categories} items={items} tableNumber={tableNumber} />
      <Location />
      <Testimonials />
      <Footer />
    </main>
  );
}
