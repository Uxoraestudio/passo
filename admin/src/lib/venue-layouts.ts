export type LayoutKey = "arena" | "teatro" | "estadio" | "custom";

export type BaseShape = {
  type: "stage" | "field";
  rect: [number, number, number, number];
  label?: string;
};

export type SectorTemplate = {
  name: string;
  short: string;
  cap: number;
  price: number;
  color: string;
  rect?: [number, number, number, number];
  path?: string;
  labelX?: number;
  labelY?: number;
};

export type Layout = {
  base: BaseShape[];
  sectors: SectorTemplate[];
};

export const PALETTE = ["#ff6a2b", "#ff9f43", "#6d3cf5", "#8b5cf6", "#2e6bff", "#16a36a"];

export const LAYOUTS: Record<Exclude<LayoutKey, "custom">, Layout> = {
  arena: {
    base: [{ type: "stage", rect: [200, 20, 200, 50], label: "ESCENARIO" }],
    sectors: [
      { name: "Cancha Golden", short: "Golden", cap: 1500, price: 85000, color: "#ff6a2b", rect: [170, 90, 260, 60] },
      { name: "Cancha General", short: "Cancha General", cap: 4000, price: 45000, color: "#ff9f43", rect: [170, 155, 260, 95] },
      { name: "Platea Baja Izquierda", short: "PB Izq.", cap: 1200, price: 60000, color: "#6d3cf5", rect: [80, 90, 75, 160] },
      { name: "Platea Baja Derecha", short: "PB Der.", cap: 1200, price: 60000, color: "#6d3cf5", rect: [445, 90, 75, 160] },
      { name: "Platea Baja Frontal", short: "Platea Baja Frontal", cap: 1500, price: 55000, color: "#8b5cf6", rect: [170, 265, 260, 55] },
      {
        name: "Platea Alta",
        short: "Platea Alta",
        cap: 5600,
        price: 30000,
        color: "#2e6bff",
        path: "M30,90 L70,90 L70,260 L160,335 L440,335 L530,260 L530,90 L570,90 L570,290 L460,400 L140,400 L30,290 Z",
        labelX: 300,
        labelY: 372,
      },
    ],
  },
  teatro: {
    base: [{ type: "stage", rect: [180, 20, 240, 50], label: "ESCENARIO" }],
    sectors: [
      { name: "Platea Preferencial", short: "Platea Preferencial", cap: 600, price: 45000, color: "#ff6a2b", rect: [140, 90, 320, 60] },
      { name: "Platea General", short: "Platea General", cap: 1400, price: 30000, color: "#ff9f43", rect: [140, 155, 320, 70] },
      {
        name: "Balcón",
        short: "Balcón",
        cap: 1200,
        price: 25000,
        color: "#6d3cf5",
        path: "M110,240 L490,240 L530,320 L70,320 Z",
        labelX: 300,
        labelY: 282,
      },
      {
        name: "Galería",
        short: "Galería",
        cap: 1300,
        price: 18000,
        color: "#2e6bff",
        path: "M55,335 L545,335 L580,405 L20,405 Z",
        labelX: 300,
        labelY: 372,
      },
    ],
  },
  estadio: {
    base: [
      { type: "field", rect: [150, 20, 300, 300] },
      { type: "stage", rect: [240, 32, 120, 36], label: "ESCENARIO" },
    ],
    sectors: [
      { name: "Cancha Preferencial", short: "Cancha Preferencial", cap: 8000, price: 90000, color: "#ff6a2b", rect: [170, 80, 260, 70] },
      { name: "Cancha General", short: "Cancha General", cap: 20000, price: 50000, color: "#ff9f43", rect: [170, 155, 260, 150] },
      { name: "Tribuna Pacífico", short: "Pacífico", cap: 12000, price: 40000, color: "#6d3cf5", rect: [70, 20, 70, 300] },
      { name: "Tribuna Andes", short: "Andes", cap: 12000, price: 35000, color: "#8b5cf6", rect: [460, 20, 70, 300] },
      { name: "Galería", short: "Galería", cap: 8000, price: 20000, color: "#2e6bff", rect: [150, 335, 300, 60] },
    ],
  },
};
