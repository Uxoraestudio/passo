export type SeatStatus = "available" | "occupied" | "selected";

export type Seat = {
  id: string;
  row: string;
  number: number;
  status: "available" | "occupied";
};

// Must match public.seat_label_valid in the database: rows A..Z, then AA..ZZ.
export function rowLabel(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  return String.fromCharCode(64 + Math.floor(index / 26)) + String.fromCharCode(65 + (index % 26));
}

export function parseSeatLabel(label: string): { row: string; number: number } {
  const match = /^([A-Z]{1,2})(\d+)$/.exec(label);
  return match ? { row: match[1], number: Number(match[2]) } : { row: label, number: 0 };
}

/** Seats fill rows of `seatsPerRow` until the sector capacity is reached. */
export function buildSeatRows(capacity: number, seatsPerRow: number, taken: ReadonlySet<string>): Seat[][] {
  const perRow = Math.max(1, seatsPerRow);
  const rowCount = Math.min(Math.ceil(capacity / perRow), 26 * 27);
  const rows: Seat[][] = [];
  for (let r = 0; r < rowCount; r++) {
    const row = rowLabel(r);
    const seats: Seat[] = [];
    for (let n = 1; n <= perRow && r * perRow + n <= capacity; n++) {
      const id = `${row}${n}`;
      seats.push({ id, row, number: n, status: taken.has(id) ? "occupied" : "available" });
    }
    rows.push(seats);
  }
  return rows;
}
