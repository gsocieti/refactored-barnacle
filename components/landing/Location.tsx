import Image from 'next/image';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { site, whatsappLink } from '@/lib/config';

export default function Location() {
  return (
    <section id="lokasi" className="scroll-mt-24 bg-kuah py-16 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-mie">Temukan Momiega</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Tiga titik kumpul favorit.</h2>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white/75 underline decoration-white/30 underline-offset-4 transition hover:text-white">
            Tanya lewat WhatsApp
          </a>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {site.branches.map((branch) => (
            <li key={branch.name} className="flex flex-col rounded-3xl border border-white/15 bg-white/10 p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-extrabold">{branch.name}</h3>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-white/70">
                {branch.address ?? branch.description}
              </p>
              <a
                href={branch.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-mie px-4 py-2 text-sm font-extrabold text-kuah transition hover:bg-white"
              >
                {branch.name === 'Bulungan' && <MapPin size={16} aria-hidden />}
                {branch.action} <ArrowUpRight size={16} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <figure className="relative min-h-[24rem] overflow-hidden rounded-3xl border-4 border-white/15 shadow-[0_20px_55px_-28px_rgba(0,0,0,0.6)]">
            <Image
              src="/momiega%20to%20bulungan.jpg"
              alt="Pengumuman Momiega membuka cabang di Bulungan"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-kuah/90 to-transparent px-5 pb-5 pt-16 font-display text-xl font-extrabold text-white">
              Kini hadir di Bulungan.
            </figcaption>
          </figure>
          <iframe
            title="Peta lokasi Momiega Bulungan"
            src={site.maps.embed}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full rounded-3xl border-4 border-white/15 shadow-[0_20px_55px_-28px_rgba(0,0,0,0.6)] lg:h-full lg:min-h-96"
          />
        </div>
      </div>
    </section>
  );
}
