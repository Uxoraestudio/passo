export type GateRow = {
  id: string;
  dotColor: string;
  name: string;
  location: string;
  validated: string;
  percent: number;
  percentLabel: string;
  capacityLabel: string;
  active: string;
  status: "Fluido" | "Alta Carga";
};

export const gateRows: GateRow[] = [
  {
    id: "norte",
    dotColor: "var(--color-success)",
    name: "Puerta Norte",
    location: "Cancha Frontal",
    validated: "1.100",
    percent: 73.3,
    percentLabel: "73.3%",
    capacityLabel: "1.500 máx",
    active: "4 activos",
    status: "Fluido",
  },
  {
    id: "poniente",
    dotColor: "var(--color-orange)",
    name: "Puerta Poniente",
    location: "Platea Preferencial",
    validated: "1.350",
    percent: 90.0,
    percentLabel: "90.0%",
    capacityLabel: "1.500 máx",
    active: "3 activos",
    status: "Alta Carga",
  },
  {
    id: "sur",
    dotColor: "var(--color-purple)",
    name: "Puerta Sur",
    location: "Cancha General",
    validated: "1.250",
    percent: 50.0,
    percentLabel: "50.0%",
    capacityLabel: "2.500 máx",
    active: "3 activos",
    status: "Fluido",
  },
  {
    id: "oriente",
    dotColor: "var(--color-success)",
    name: "Puerta Oriente",
    location: "Tribuna Andes",
    validated: "586",
    percent: 59.6,
    percentLabel: "59.6%",
    capacityLabel: "982 máx",
    active: "2 activos",
    status: "Fluido",
  },
];

export type IncidentEntry = {
  id: string;
  icon: string;
  title: string;
  code: string;
  description: string;
  time: string;
  terminal: string;
};

export const incidentLog: IncidentEntry[] = [
  {
    id: "dup-782190",
    icon: "content_copy",
    title: "CÓDIGO DUPLICADO",
    code: "TKT-782190-LP",
    description: "Primer ingreso a las 19:14:02 en Puerta Poniente. Segundo intento en Puerta Sur.",
    time: "19:41:08",
    terminal: "Terminal #07",
  },
  {
    id: "wrong-441892",
    icon: "error",
    title: "ACCESO INCORRECTO",
    code: "TKT-441892-AB",
    description: "Boleto de Tribuna presentado en Puerta Norte (Cancha Frontal).",
    time: "19:39:50",
    terminal: "Terminal #02",
  },
  {
    id: "void-119284",
    icon: "block",
    title: "BOLETO ANULADO / REVERSADO",
    code: "TKT-119284-QQ",
    description: "Entrada reportada por contracargo bancario a las 17:30 hrs.",
    time: "19:36:22",
    terminal: "Terminal #11",
  },
];
