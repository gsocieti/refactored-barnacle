// Satu sumber data profil restoran: dipakai UI, metadata, dan JSON-LD.
// Item bertanda SESUAIKAN adalah placeholder, ganti sebelum go-live.
const lat = -6.2388868;
const lng = 106.7969646;

export const site = {
  name: 'Momiega',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  tagline: 'Mie ayam, mie yamin, ramen, dan minuman untuk teman berkumpul.',
  description:
    'Momiega hadir di Bulungan, Tebet, dan Condet. Lihat menu mie ayam, mie yamin, ramen, minuman, dan lokasi terdekat.',
  keywords: ['momiega', 'mie enak jakarta selatan', 'mie yamin bulungan', 'mie tebet', 'ramen', 'kuliner jakarta selatan'],
  priceRange: 'Rp',
  address: {
    street: 'Jl. Hangtuah X No.3, RT.2/RW.8',
    locality: 'Gunung, Kec. Kebayoran Baru',
    city: 'Jakarta Selatan',
    region: 'DKI Jakarta',
    postalCode: '12120',
  },
  geo: { lat, lng },
  maps: {
    shortUrl: 'https://www.google.com/maps/place/Momiega+Bulungan/@-6.2388868,106.7969646,17z',
    directions: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    embed: `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`,
  },
  whatsapp: '6288296254383',
  gofoodUrl: 'https://gofood.link/a/F4i1byu?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAb21jcAUq_71leHRuA2FlbQIxMQBwZG9mAnNydGMGYXBwX2lkDzU2NzA2NzM0MzM1MjQyNwABp0VaK4ZyVWklZ4MMCOEmaCEV8DzlLru5uiQnZ8mcj-wzLgsrjONwwBMtGsgR_aem_coAHTXn3BqHx2oU1H-x83Q',
  hoursLabel: 'Cek jam buka terbaru di Google Maps',
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/momie_ga/' },
    { label: 'Threads', href: 'https://www.threads.net/@momie_ga' },
  ],
  branches: [
    {
      name: 'Bulungan',
      address: 'Jl. Hangtuah X No.3, RT.2/RW.8, Gunung, Kec. Kebayoran Baru, Jakarta Selatan 12120',
      href: 'https://www.google.com/maps/place/Momiega+Bulungan/@-6.2388868,106.7969646,17z',
      action: 'Lihat lokasi',
    },
    {
      name: 'Tebet',
      description: 'Mau menikmati Momiega di rumah? Pesan cabang Tebet melalui GoFood.',
      href: 'https://gofood.link/a/F4i1byu?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAb21jcAUq_71leHRuA2FlbQIxMQBwZG9mAnNydGMGYXBwX2lkDzU2NzA2NzM0MzM1MjQyNwABp0VaK4ZyVWklZ4MMCOEmaCEV8DzlLru5uiQnZ8mcj-wzLgsrjONwwBMtGsgR_aem_coAHTXn3BqHx2oU1H-x83Q',
      action: 'Pesan di GoFood',
    },
    {
      name: 'Condet',
      status: 'Ada di Maps',
      address: 'Jl. Raya Condet No.103, RT.4/RW.3, Batu Ampar, Kec. Kramat Jati, Jakarta Timur 13520',
      href: 'https://maps.app.goo.gl/h1NbXKBjUGsCP5qu7',
      action: 'Lihat lokasi',
    },
  ],
  highlights: [
    { title: 'Mie jadi bintangnya', text: 'Mie kenyal dengan topping dan kuah yang jadi alasan orang kembali.' },
    { title: 'Teman makan lengkap', text: 'Pilih mie halus, karet, atau lebar, lengkap dengan topping dan minuman dingin.' },
    { title: 'Tiga lokasi, satu rasa', text: 'Kunjungi Momiega di Bulungan, Tebet, atau Condet.' },
  ],
  reviews: [
    { name: 'abbi alrasyid · Google Maps', text: 'Mantap, ramennya top, mie karetnya besssst.. Service cepat.' },
    { name: 'Erica Yunisma · Google Maps', text: 'Nyobain Yaminnya enak banget, mienya lembut kenyal, porsinya pas.' },
    { name: 'oky angga · Google Maps', text: 'Kombinasi yg tepat sebelum ngopi ya ngebakmi.' },
  ],
  googleRating: '5,0',
  googleReviewCount: 46,
  googleReviewsUrl: 'https://www.google.com/maps/place/Momiega+Bulungan/@-6.2388868,106.7969646,17z',
};

export const whatsappLink = (text = 'Halo Momiega, saya mau tanya.') =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
