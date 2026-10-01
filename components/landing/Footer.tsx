import Image from 'next/image';
import { site } from '@/lib/config';

export default function Footer() {
  return (
    <footer className="bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 border-t border-kuah/10 px-5 pt-7 text-sm sm:flex-row sm:items-center sm:justify-between">
        <a href="#" aria-label="Momiega, kembali ke atas" className="inline-flex">
          <Image src="/brand/momiega-logo.png" alt="Momiega" width={713} height={235} className="h-9 w-auto" />
        </a>
        <p className="text-kuah/60">© {new Date().getFullYear()} {site.name}. Made by PulangKantor <span aria-label="love">♥</span></p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
          {site.social.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} @momie_ga`} className="transition-colors hover:text-cabai">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
