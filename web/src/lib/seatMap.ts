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

/**
 * Row and seat number from a seat label, or null when the label can't be read
 * unambiguously. Handles the grid format ("A12") and venue-plan labels with a
 * hyphen-separated prefix or numeric rows ("PB-A12", "1-12", "PB-1-12").
 */
export function parseSeatLabel(label: string): { row: string; number: number } | null {
  const patterns = [/^([A-Z]{1,2})(\d+)$/, /^(\d{1,3})-(\d+)$/, /^.+-([A-Z]{1,2})(\d+)$/, /^.+-(\d{1,3})-(\d+)$/];
  for (const pattern of patterns) {
    const match = pattern.exec(label);
    if (match) return { row: match[1], number: Number(match[2]) };
  }
  return null;
}

/** "Fila A · Asiento 12" when the label can be read, "Asiento PIA1" otherwise. */
export function describeSeat(label: string, row?: string | null, number?: number | null): string {
  if (row && number != null) return `Fila ${row} · Asiento ${number}`;
  const parsed = parseSeatLabel(label);
  return parsed ? `Fila ${parsed.row} · Asiento ${parsed.number}` : `Asiento ${label}`;
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
