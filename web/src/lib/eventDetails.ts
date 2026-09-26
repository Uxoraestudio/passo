export type TicketTier = {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "disponible" | "pocas";
  color: string;
  numbered: boolean;
  badge?: string;
};

export type EventDetail = {
  category: string;
  breadcrumbCategory: string;
  primaryBadge: string;
  badges: string[];
  dateLabel: string;
  dateSub: string;
  doorsOpen: string;
  doorsClose: string;
  aboutLead: string;
  aboutText: string[];
  tiers: TicketTier[];
};

export const eventDetails: Record<string, EventDetail> = {
  "dua-lipa": {
    category: "Conciertos",
    breadcrumbCategory: "Conciertos",
    primaryBadge: "Venta General Abierta",
    badges: ["E-Ticket Nominativo Verificado", "Acceso Rápido QR"],
    dateLabel: "24 Octubre 2026",
    dateSub: "Viernes",
    doorsOpen: "19:00 hrs",
    doorsClose: "23:30 hrs",
    aboutLead: "El Radical Optimism Tour aterriza en Santiago.",
    aboutText: [
      "Dua Lipa trae a Chile su producción más ambiciosa hasta la fecha, con una puesta en escena de última generación, banda en vivo y un repertorio que recorre sus tres discos de estudio.",
      "Una noche pensada para bailar de principio a fin, con invitados sorpresa y un despliegue visual que convierte al Movistar Arena en el centro de la música pop mundial por una noche.",
    ],
    tiers: [
      { id: "preferencial", name: "Cancha Preferencial", description: "Sector delantero, más cerca del escenario", price: 62000, status: "disponible", color: "#ff782d", numbered: false, badge: "Ubicación Premium" },
      { id: "general", name: "Entrada General", description: "Acceso a cancha general, de pie", price: 48000, status: "disponible", color: "#6534f5", numbered: false },
      { id: "vip", name: "Palco VIP", description: "Asiento numerado, bar exclusivo y acceso anticipado", price: 95000, status: "pocas", color: "#3b82f6", numbered: true, badge: "Asiento numerado" },
    ],
  },
  "imagine-dragons": {
    category: "Conciertos",
    breadcrumbCategory: "Conciertos",
    primaryBadge: "Preventa Banco de Chile",
    badges: ["E-Ticket Nominativo Verificado"],
    dateLabel: "14 Noviembre 2026",
    dateSub: "Sábado",
    doorsOpen: "18:30 hrs",
    doorsClose: "23:00 hrs",
    aboutLead: "El LOOM World Tour llega al Estadio Nacional.",
    aboutText: [
      "Imagine Dragons presenta en Chile los himnos que los llevaron a la cima junto a los nuevos éxitos de su disco LOOM, en un show cargado de pirotecnia, pantallas gigantes y energía en cada canción.",
      "Una producción de estadio completa, con teloneros locales confirmados y zonas de acceso pensadas para vivir la experiencia desde distintos ángulos del recinto.",
    ],
    tiers: [
      { id: "vip", name: "Cancha VIP", description: "Sector exclusivo cerca del escenario", price: 110000, status: "pocas", color: "#ff782d", numbered: false, badge: "Ubicación Premium" },
      { id: "general", name: "Cancha General", description: "Acceso de pie a cancha completa", price: 52000, status: "disponible", color: "#6534f5", numbered: false },
      { id: "tribuna", name: "Tribuna Numerada", description: "Asiento numerado con vista lateral", price: 68000, status: "disponible", color: "#3b82f6", numbered: true, badge: "Asiento numerado" },
    ],
  },
  "clasico-pacifico": {
    category: "Deportes",
    breadcrumbCategory: "Deportes",
    primaryBadge: "Venta General Abierta",
    badges: ["E-Ticket Nominativo Verificado", "Acceso Familiar"],
    dateLabel: "05 Diciembre 2026",
    dateSub: "Sábado",
    doorsOpen: "17:00 hrs",
    doorsClose: "21:30 hrs",
    aboutLead: "Chile y Perú se enfrentan en el Clásico del Pacífico.",
    aboutText: [
      "El clásico sudamericano vuelve al Estadio Nacional con ambas selecciones jugándose puntos clave. Un ambiente de fiesta y rivalidad histórica en la cancha más grande del país.",
      "Zonas familiares habilitadas, previa oficial en los alrededores del estadio y toda la logística pensada para llegar y salir de forma segura y rápida.",
    ],
    tiers: [
      { id: "palco", name: "Palco Premium", description: "Butaca central con servicio de catering", price: 89000, status: "pocas", color: "#ff782d", numbered: true, badge: "Ubicación Premium" },
      { id: "general", name: "Galería General", description: "Acceso a galería, entrada por sector norte", price: 28000, status: "disponible", color: "#6534f5", numbered: false },
      { id: "tribuna", name: "Tribuna Andes", description: "Asiento numerado, sector cubierto", price: 45000, status: "disponible", color: "#3b82f6", numbered: true, badge: "Asiento numerado" },
    ],
  },
  "rey-leon": {
    category: "Teatro",
    breadcrumbCategory: "Teatro y musicales",
    primaryBadge: "Temporada Limitada",
    badges: ["E-Ticket Nominativo Verificado"],
    dateLabel: "18 Enero 2027",
    dateSub: "Domingo",
    doorsOpen: "17:30 hrs",
    doorsClose: "20:15 hrs",
    aboutLead: "El musical más aclamado del mundo llega a Santiago.",
    aboutText: [
      "El Rey León combina vestuario, máscaras y escenografía premiadas con la música original de Elton John y Tim Rice, en una producción que ha emocionado a millones de espectadores en todo el mundo.",
      "Una función apta para toda la familia, con funciones limitadas en el Teatro Municipal antes de continuar su gira por Sudamérica.",
    ],
    tiers: [
      { id: "palco", name: "Palco Preferencial", description: "Mejor vista del escenario, acceso preferente", price: 72000, status: "pocas", color: "#ff782d", numbered: true, badge: "Ubicación Premium" },
      { id: "platea-baja", name: "Platea Baja", description: "Vista frontal, nivel principal", price: 48000, status: "disponible", color: "#6534f5", numbered: true, badge: "Asiento numerado" },
      { id: "platea-alta", name: "Platea Alta", description: "Vista general, nivel superior", price: 32000, status: "disponible", color: "#3b82f6", numbered: true, badge: "Asiento numerado" },
    ],
  },
  "los-bunkers": {
    category: "Conciertos",
    breadcrumbCategory: "Conciertos",
    primaryBadge: "Venta General Abierta",
    badges: ["E-Ticket Nominativo Verificado"],
    dateLabel: "28 Octubre 2026",
    dateSub: "Miércoles",
    doorsOpen: "19:30 hrs",
    doorsClose: "23:00 hrs",
    aboutLead: "Los Bunkers regresan con su gira \"Ven Aquí\".",
    aboutText: [
      "La banda concepcionana repasa los clásicos que marcaron a toda una generación, junto a canciones de su nuevo material, en una noche íntima pensada para el Movistar Arena.",
      "Un regreso esperado por miles de fans, con banda completa en vivo y un repertorio que mezcla nostalgia con nuevas composiciones.",
    ],
    tiers: [
      { id: "preferencial", name: "Cancha Preferencial", description: "Sector delantero, más cerca del escenario", price: 58000, status: "disponible", color: "#ff782d", numbered: false, badge: "Ubicación Premium" },
      { id: "general", name: "Entrada General", description: "Acceso a cancha general, de pie", price: 42000, status: "disponible", color: "#6534f5", numbered: false },
    ],
  },
  "pedro-ruminot": {
    category: "Comedia",
    breadcrumbCategory: "Comedia y stand up",
    primaryBadge: "Venta General Abierta",
    badges: ["E-Ticket Nominativo Verificado"],
    dateLabel: "09 Noviembre 2026",
    dateSub: "Lunes",
    doorsOpen: "20:00 hrs",
    doorsClose: "22:00 hrs",
    aboutLead: "Pedro Ruminot vuelve a los escenarios con humor nuevo.",
    aboutText: [
      "Un show de stand up cargado de observaciones cotidianas y el humor característico que lo ha convertido en uno de los comediantes más queridos de Chile.",
      "Función única en el Teatro Caupolicán, con material completamente nuevo y algunas sorpresas para el público.",
    ],
    tiers: [
      { id: "preferencial", name: "Platea Preferencial", description: "Primeras filas, mejor vista del escenario", price: 38000, status: "pocas", color: "#ff782d", numbered: true, badge: "Asiento numerado" },
      { id: "general", name: "Entrada General", description: "Butaca numerada, nivel principal", price: 26000, status: "disponible", color: "#6534f5", numbered: true, badge: "Asiento numerado" },
    ],
  },
  lollapalooza: {
    category: "Festivales",
    breadcrumbCategory: "Festivales",
    primaryBadge: "Preventa Exclusiva Banco de Chile",
    badges: ["Fase 2 · 82% Vendido", "E-Ticket Nominativo Verificado"],
    dateLabel: "20 – 22 Marzo 2026",
    dateSub: "Viernes, Sábado y Domingo",
    doorsOpen: "12:00 hrs",
    doorsClose: "23:30 hrs",
    aboutLead: "Tres días de música, arte y cultura al aire libre.",
    aboutText: [
      "El regreso de Lollapalooza Chile 2026 consolida al festival internacional más grande de Sudamérica como el absoluto rey de los festivales en la región. Durante 3 jornadas, más de 100 artistas y bandas del más alto renombre internacional se presentarán en 6 escenarios simultáneos con una especial curaduría de sonido, iluminación envolvente y experiencias interactivas irrepetibles.",
      "Además de la lineup en vivo, el festival presenta áreas icónicas transformadas: el exclusivo Lolla Lounge VIP con comodidades de primer nivel, la zona familiar y segura Kidzapalooza con actividades recreativas para menores de 10 años, el espacio ecológico Aldea Verde y una selección de foodtrucks y firmas gastronómicas locales e internacionales.",
    ],
    tiers: [
      { id: "vip", name: "Pase Lolla Lounge VIP", description: "Bar abierto, tarimas elevadas y sombra", price: 340000, status: "pocas", color: "#ff782d", numbered: false, badge: "Ubicación Premium" },
      { id: "general-3d", name: "Pase General 3 Días", description: "Acceso total Viernes, Sábado y Domingo", price: 168000, status: "disponible", color: "#6534f5", numbered: false },
      { id: "sabado", name: "Pase Diario Sábado", description: "Acceso único 21 de Marzo", price: 78000, status: "pocas", color: "#3b82f6", numbered: false },
      { id: "viernes", name: "Pase Diario Viernes", description: "Acceso único 20 de Marzo", price: 68000, status: "disponible", color: "#14b8a6", numbered: false },
    ],
  },
  "ballet-nacional": {
    category: "Danza",
    breadcrumbCategory: "Teatro y danza",
    primaryBadge: "Temporada Limitada",
    badges: ["E-Ticket Nominativo Verificado"],
    dateLabel: "13 Diciembre 2026",
    dateSub: "Domingo",
    doorsOpen: "17:30 hrs",
    doorsClose: "19:30 hrs",
    aboutLead: "El Ballet Nacional presenta El Lago de los Cisnes.",
    aboutText: [
      "Una de las obras más queridas del repertorio clásico universal, interpretada por el cuerpo de baile del Ballet Nacional Chileno con música en vivo de la Orquesta del Teatro Municipal.",
      "Escenografía y vestuario de época para una tarde inolvidable, ideal para quienes se inician en la danza clásica y para los amantes de siempre.",
    ],
    tiers: [
      { id: "palco", name: "Palco Preferencial", description: "Mejor vista del escenario, acceso preferente", price: 55000, status: "pocas", color: "#ff782d", numbered: true, badge: "Ubicación Premium" },
      { id: "platea-baja", name: "Platea Baja", description: "Vista frontal, nivel principal", price: 36000, status: "disponible", color: "#6534f5", numbered: true, badge: "Asiento numerado" },
      { id: "platea-alta", name: "Platea Alta", description: "Vista general, nivel superior", price: 24000, status: "disponible", color: "#3b82f6", numbered: true, badge: "Asiento numerado" },
    ],
  },
};

export const genericPolicies = [
  { title: "E-Ticket Digital Passo", text: "Tu código QR nominativo llega a tu correo y a la app oficial. Solo debes mostrarlo el día del evento, sin necesidad de imprimir nada." },
  { title: "Nominación Obligatoria", text: "Cada entrada debe estar nominada con RUT o Pasaporte. 1 cambio de titular gratis hasta 72h antes del evento." },
  { title: "Garantía Oficial de Devolución", text: "Protección respaldada por la Ley del Consumidor ante suspensión o reprogramación del evento." },
];

export const genericFaqs = [
  {
    q: "¿Cómo y cuándo recibo mi entrada?",
    a: "Tu E-Ticket nominativo llega a tu correo y queda disponible en la app oficial apenas se confirma el pago. Puedes mostrarlo digitalmente el día del evento.",
  },
  {
    q: "¿Puedo cambiar el titular de mi entrada?",
    a: "Sí, puedes hacer 1 cambio de titular gratuito hasta 72 horas antes del evento desde tu cuenta, sujeto a la disponibilidad de nominación del recinto.",
  },
  {
    q: "¿Qué pasa si el evento se reprograma o cancela?",
    a: "Cuentas con Garantía Oficial de Devolución respaldada por la Ley del Consumidor ante cualquier suspensión o reprogramación confirmada por el productor.",
  },
  {
    q: "¿Hay accesos para personas con movilidad reducida?",
    a: "Sí, todos los recintos cuentan con accesos y sectores habilitados para personas con movilidad reducida. Escríbenos a soporte para coordinar tu ingreso.",
  },
];
