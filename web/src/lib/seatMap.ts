export type SeatStatus = "available" | "occupied" | "accessible" | "selected";

export type Seat = {
  id: string;
  row: string;
  number: number;
  status: "available" | "occupied" | "accessible";
};

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const SEATS_PER_ROW = 18;

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return (h % 1000) / 1000;
  };
}

export function generateSeatMap(sectorId: string): Seat[][] {
  const random = seededRandom(sectorId);
  return ROWS.map((row, rowIndex) => {
    const seats: Seat[] = [];
    for (let n = 1; n <= SEATS_PER_ROW; n++) {
      const isEdge = n === 1 || n === SEATS_PER_ROW;
      const isAccessibleRow = rowIndex === 0 || rowIndex === ROWS.length - 1;
      let status: Seat["status"] = "available";
      if (isEdge && isAccessibleRow) {
        status = "accessible";
      } else if (random() < 0.16) {
        status = "occupied";
      }
      seats.push({ id: `${row}${n}`, row, number: n, status });
    }
    return seats;
  });
}
