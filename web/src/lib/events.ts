export type EventCardData = {
  id: string;
  slug?: string;
  image: string;
  alt: string;
  day: string;
  month: string;
  title: string;
  subtitle: string;
  venue: string;
  city: string;
  price: string;
  tags: { label: string; variant: "primary" | "secondary" | "orange" }[];
};

export const featuredEvents: EventCardData[] = [
  {
    id: "dua-lipa",
    slug: "dua-lipa",
    image: "/images/event-dua-lipa.jpg",
    alt: "Dua Lipa - Radical Optimism Tour",
    day: "24",
    month: "OCT",
    title: "Dua Lipa",
    subtitle: "Radical Optimism Tour",
    venue: "Movistar Arena",
    city: "Santiago",
    price: "$ 48.000",
    tags: [
      { label: "MÚSICA", variant: "primary" },
      { label: "POP", variant: "secondary" },
    ],
  },
  {
    id: "imagine-dragons",
    slug: "imagine-dragons",
    image: "/images/event-imagine-dragons.jpg",
    alt: "Imagine Dragons - LOOM World Tour",
    day: "14",
    month: "NOV",
    title: "Imagine Dragons",
    subtitle: "LOOM World Tour",
    venue: "Estadio Nacional",
    city: "Santiago",
    price: "$ 52.000",
    tags: [
      { label: "MÚSICA", variant: "primary" },
      { label: "ROCK", variant: "secondary" },
    ],
  },
  {
    id: "clasico-pacifico",
    slug: "clasico-pacifico",
    image: "/images/event-clasico-pacifico.jpg",
    alt: "Clásico del Pacífico - Chile vs Perú",
    day: "05",
    month: "DIC",
    title: "Clásico del Pacífico",
    subtitle: "Chile vs Perú",
    venue: "Estadio Nacional",
    city: "Santiago",
    price: "$ 28.000",
    tags: [
      { label: "DEPORTES", variant: "orange" },
      { label: "FÚTBOL", variant: "secondary" },
    ],
  },
  {
    id: "rey-leon",
    slug: "rey-leon",
    image: "/images/event-rey-leon.jpg",
    alt: "El Rey León - El musical que emociona",
    day: "18",
    month: "ENE",
    title: "El Rey León",
    subtitle: "El musical que emociona",
    venue: "Teatro Municipal",
    city: "Santiago",
    price: "$ 32.000",
    tags: [
      { label: "TEATRO", variant: "primary" },
      { label: "MUSICAL", variant: "secondary" },
    ],
  },
];

export const nearYouEvents: EventCardData[] = [
  {
    id: "los-bunkers",
    slug: "los-bunkers",
    image: "/images/event-los-bunkers.jpg",
    alt: "Los Bunkers - Gira Ven Aquí",
    day: "28",
    month: "OCT",
    title: "Los Bunkers",
    subtitle: "Gira Ven Aquí",
    venue: "Movistar Arena",
    city: "Santiago",
    price: "$ 42.000",
    tags: [
      { label: "MÚSICA", variant: "primary" },
      { label: "ROCK CHILENO", variant: "secondary" },
    ],
  },
  {
    id: "pedro-ruminot",
    slug: "pedro-ruminot",
    image: "/images/event-lollapalooza.jpg",
    alt: "Pedro Ruminot - Regreso al humor",
    day: "09",
    month: "NOV",
    title: "Pedro Ruminot",
    subtitle: "Regreso al humor",
    venue: "Teatro Caupolicán",
    city: "Santiago",
    price: "$ 26.000",
    tags: [
      { label: "COMEDIA", variant: "orange" },
      { label: "STAND UP", variant: "secondary" },
    ],
  },
  {
    id: "lollapalooza",
    slug: "lollapalooza-chile-2026",
    image: "/images/event-pedro-ruminot.jpg",
    alt: "Lollapalooza Chile 2026 - Mucho más que música",
    day: "20",
    month: "MAR",
    title: "Lollapalooza Chile 2026",
    subtitle: "Mucho más que música",
    venue: "Parque Bicentenario de Cerrillos",
    city: "Santiago",
    price: "$ 68.000",
    tags: [
      { label: "FESTIVALES", variant: "primary" },
      { label: "VARIOS GÉNEROS", variant: "secondary" },
    ],
  },
  {
    id: "ballet-nacional",
    slug: "ballet-nacional",
    image: "/images/event-ballet-nacional.jpg",
    alt: "Ballet Nacional - El Lago de los Cisnes",
    day: "13",
    month: "DIC",
    title: "Ballet Nacional",
    subtitle: "El Lago de los Cisnes",
    venue: "Teatro Municipal",
    city: "Santiago",
    price: "$ 24.000",
    tags: [
      { label: "TEATRO", variant: "primary" },
      { label: "DANZA", variant: "secondary" },
    ],
  },
];

export const allEvents: EventCardData[] = [...featuredEvents, ...nearYouEvents];

export const cities = ["Santiago", "Viña del Mar", "Valparaíso", "Concepción", "Antofagasta"];

export function eventHref(event: EventCardData): string {
  return event.slug ? `/eventos/${event.slug}` : "/eventos";
}

export function eventBySlug(slug: string): EventCardData | undefined {
  return allEvents.find((event) => event.slug === slug);
}

export function searchEvents(query: string, source: EventCardData[] = allEvents): EventCardData[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return source.filter((event) => {
    const haystack = [
      event.title,
      event.subtitle,
      event.venue,
      event.city,
      ...event.tags.map((tag) => tag.label),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
