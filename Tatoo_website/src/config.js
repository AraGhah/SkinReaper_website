/* Site configuration */
export const PROPS = {
  lang: 'en',            // default language, 'en' or 'fr'
  bookingUrl: '',        // Google Apps Script Web app URL (ends in /exec). Enables automatic booking
  formEndpoint: 'https://formsubmit.co/ajax/skinreaper_@outlook.com', // fallback when bookingUrl is empty
  gcalId: '',            // optional public Google Calendar ID (read only availability)
  gcalKey: ''            // optional Google API key used with gcalId
};

export const EMAIL = 'skinreaper_@outlook.com';
export const IG_URL = 'https://instagram.com/_skinreaper';
export const IG_HANDLE = '@_skinreaper';
export const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Velours+Tattoo+3455+Saint-Laurent+Blvd+Montreal+QC';
export const MAP_EMBED = 'https://www.openstreetmap.org/export/embed.html?bbox=-73.5790%2C45.5110%2C-73.5640%2C45.5180&layer=mapnik&marker=45.5145%2C-73.5715';
export const LOCATION = 'Velours Tattoo, 3455 Saint-Laurent Blvd, Montréal, QC H2X 2T6';
export const TZ = 'America/Toronto';

export const SECTIONS = ['work', 'about', 'pricing', 'faq', 'studio'];

export const WORKS = [
  { src: '/img/w1.png', cat: 'cyber', place: { en: 'Full arm', fr: 'Bras complet' } },
  { src: '/img/w2.png', cat: 'lettering', place: { en: 'Calf', fr: 'Mollet' } },
  { src: '/img/w3.png', cat: 'cyber', place: { en: 'Chest', fr: 'Poitrine' } },
  { src: '/img/w4.png', cat: 'lettering', place: { en: 'Forearm', fr: 'Avant-bras' } },
  { src: '/img/w5.png', cat: 'cyber', place: { en: 'Leg', fr: 'Jambe' } },
  { src: '/img/w6.png', cat: 'lettering', place: { en: 'Back', fr: 'Dos' } },
  { src: '/img/w7.png', cat: 'lettering', place: { en: 'Shoulder blade', fr: 'Omoplate' } },
  { src: '/img/w8.png', cat: 'cyber', place: { en: 'Chest & torso', fr: 'Poitrine et torse' } },
  { src: '/img/w9.png', cat: 'lettering', place: { en: 'Forearm', fr: 'Avant-bras' } },
  { src: '/img/w10.png', cat: 'lettering', place: { en: 'Inner arm', fr: 'Intérieur du bras' } }
];

export const CATS = {
  cyber: { en: 'Cyber / sigil', fr: 'Cyber / sigil' },
  lettering: { en: 'Lettering', fr: 'Lettrage' }
};

export const HERO_IMG = '/img/w1.png';
export const ABOUT_IMG = '/img/w8.png';
export const STUDIO_IMG = '/img/studio.png';
