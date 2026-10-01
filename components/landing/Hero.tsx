import Image from 'next/image';
import { MapPin, MessageCircle, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { site, whatsappLink } from '@/lib/config';

export default function Hero() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-kuah/10 bg-mie/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <a href="#" aria-label="Momiega, kembali ke atas" className="shrink-0">
            <Image
              src="/brand/momiega-logo.png"
              alt="Momiega — Bakmie, Coffee, Chill"
              width={713}
              height={235}
              priority
              className="h-10 w-auto sm:h-12"
            />
          </a>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a href="#menu" className="transition-colors hover:text-cabai">Menu</a>
            <a href="#cerita" className="transition-colors hover:text-cabai">Tentang kami</a>
            <a href="#lokasi" className="transition-colors hover:text-cabai">Lokasi</a>
          </nav>
          <a href={whatsappLink('Halo Momiega, saya mau pesan.')} target="_blank" rel="noopener noreferrer" className="rounded-full bg-cabai px-4 py-2 text-xs font-bold text-white transition hover:bg-cabai/90 sm:px-5 sm:text-sm">
            <MessageCircle className="mr-2 inline" size={17} aria-hidden /> Pesan via WhatsApp
          </a>
        </div>
      </header>
      <section className="overflow-hidden bg-mie">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:py-16 md:grid-cols-[1.05fr_0.95fr] md:gap-12 lg:py-20">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-cabai/20 bg-white/70 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-cabai sm:text-sm">
              Bakmie · Coffee · Chill
            </p>
            <h1 className="mt-6 max-w-2xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Makan enak, <span className="text-cabai">hati senang.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-kuah/75 sm:text-lg sm:leading-8">
              {site.tagline} Dibuat hangat, disajikan dengan sepenuh hati.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#menu" className="btn border-cabai bg-cabai text-white shadow-none hover:bg-cabai/90">
                <UtensilsCrossed size={19} aria-hidden /> Lihat menu
              </a>
              <a href={site.maps.directions} target="_blank" rel="noopener noreferrer" className="btn border-kuah/15 bg-white/75 text-kuah shadow-none hover:bg-white">
                <MapPin size={19} aria-hidden /> Temukan kami
              </a>
            </div>
            <a
              href={site.gofoodUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-cabai/15 bg-white/70 px-4 py-2 text-sm font-bold text-kuah transition hover:border-cabai/40 hover:bg-white"
            >
              <ShoppingBag size={17} className="text-cabai" aria-hidden />
              Kini tersedia di GoFood <span className="text-cabai">(Tebet)</span>
            </a>
            <div className="mt-9 flex items-center gap-3 text-sm text-kuah/65">
              <span className="flex -space-x-2" aria-hidden>
                <span className="h-3 w-3 rounded-full border-2 border-mie bg-cabai" />
                <span className="h-3 w-3 rounded-full border-2 border-mie bg-[#E4A849]" />
                <span className="h-3 w-3 rounded-full border-2 border-mie bg-[#648247]" />
              </span>
              Kini hadir di Bulungan.
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[480px]">
            <div className="absolute -inset-4 rotate-3 rounded-[2.5rem] bg-cabai/10 sm:-inset-5" aria-hidden />
            <div className="relative aspect-[4/4.3] overflow-hidden rounded-[2rem] border-[6px] border-white bg-white shadow-[0_24px_70px_-28px_rgba(59,34,22,0.38)]">
              <Image
                src="/Mie%20Ayam%20Bakso%20Halus.jpeg"
                alt="Semangkuk mie ayam bakso Momiega dengan topping melimpah"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 42vw"
                className="object-cover object-[center_68%]"
              />
            </div>
            <div className="absolute -bottom-4 -left-2 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_32px_-16px_rgba(59,34,22,0.5)] sm:-left-8 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-widest text-cabai">Favorit untuk dinikmati bersama</p>
              <p className="mt-1 font-display text-lg font-extrabold">Semangkuk bahagia 🍜</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
