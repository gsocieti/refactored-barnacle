import { site } from '@/lib/config';

export default function RestaurantJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${site.url}/#restaurant`,
    name: site.name,
    url: site.url,
    description: site.description,
    servesCuisine: ['Mie Ayam', 'Mie Yamin', 'Ramen', 'Indonesian'],
    priceRange: site.priceRange,
    telephone: `+${site.whatsapp}`,
    hasMap: site.maps.shortUrl,
    sameAs: site.social.map((s) => s.href),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.street}, ${site.address.locality}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: 'ID',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
