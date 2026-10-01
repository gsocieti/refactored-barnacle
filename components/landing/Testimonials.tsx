import { Quote, Star } from 'lucide-react';
import { site } from '@/lib/config';

export default function Testimonials() {
  return (
    <section id="cerita" className="scroll-mt-24 bg-mie py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-cabai">Lebih dari sekadar mie</p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Cerita dari pelanggan Momiega.</h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {site.highlights.map((h, index) => (
            <li key={h.title} className="rounded-3xl border border-kuah/10 bg-white/85 p-6 shadow-[0_12px_36px_-26px_rgba(59,34,22,0.35)]">
              <span className="font-display text-3xl font-extrabold text-cabai/35">0{index + 1}</span>
              <h3 className="mt-4 font-display text-xl font-bold">{h.title}</h3>
              <p className="mt-2 text-sm leading-6 text-kuah/65">{h.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 rounded-3xl border border-cabai/10 bg-white/60 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-2xl font-extrabold">Ulasan Google</p>
              <p className="mt-1 text-sm text-kuah/65">Berdasarkan ulasan pelanggan di Google Maps</p>
            </div>
            <div className="flex items-center gap-2" aria-label={`${site.googleRating} dari 5 bintang, ${site.googleReviewCount} ulasan`}>
              <span className="font-display text-3xl font-extrabold">{site.googleRating}</span>
              <div>
                <div className="flex text-[#E4A849]" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="mt-1 text-xs text-kuah/60">{site.googleReviewCount} ulasan</p>
              </div>
            </div>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {site.reviews.map((r) => (
              <li key={r.name} className="flex flex-col rounded-2xl border border-kuah/10 bg-white p-5">
                <Quote className="mb-3 text-cabai" size={21} aria-hidden />
                <blockquote className="flex-1 text-sm font-semibold leading-6">“{r.text}”</blockquote>
                <p className="mt-4 text-xs font-bold text-kuah/55">{r.name}</p>
              </li>
            ))}
          </ul>
          <a href={site.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full border border-kuah/15 px-4 py-2 text-sm font-bold transition hover:border-cabai hover:text-cabai">
            Lihat ulasan di Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}
