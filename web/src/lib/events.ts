export type EventCardData = {
  id: string;
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
      { label: "DEPORTE", variant: "orange" },
      { label: "FÚTBOL", variant: "secondary" },
    ],
  },
  {
    id: "rey-leon",
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
    image: "/images/event-pedro-ruminot.jpg",
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
    image: "/images/event-lollapalooza.jpg",
    alt: "Lollapalooza Chile 2025 - Mucho más que música",
    day: "22",
    month: "NOV",
    title: "Lollapalooza Chile 2025",
    subtitle: "Mucho más que música",
    venue: "Parque O'Higgins",
    city: "Santiago",
    price: "$ 68.000",
    tags: [
      { label: "FESTIVAL", variant: "primary" },
      { label: "VARIOS GÉNEROS", variant: "secondary" },
    ],
  },
  {
    id: "ballet-nacional",
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
