"use client";

import type { EventSeatSector, PriceZone } from "@/lib/event-seats-data";
import { addSeat, countSeats, currency, emptyCounts, type SeatCounts } from "./seatStats";
import editorStyles from "../venue-editor/VenueEditor.module.css";
import styles from "./EventSeats.module.css";

const n = (v: number) => v.toLocaleString("es-CL");

/** Capacity by sector and by price zone, plus what would stop seats from selling. */
export default function SeatsSummary({ sectors, zones }: { sectors: EventSeatSector[]; zones: PriceZone[] }) {
  const seated = sectors.filter((s) => s.seats.length > 0);
  const bySector = seated.map((s) => ({ sector: s, counts: countSeats(s.seats) }));
  const total = bySector.reduce((acc, { sector, counts }) => {
    if (!sector.isActive) return acc;
    (Object.keys(acc) as (keyof SeatCounts)[]).forEach((k) => (acc[k] += counts[k]));
    return acc;
  }, emptyCounts());
  const general = sectors.filter((s) => s.seats.length === 0 && s.isActive);
  const generalCap = general.reduce((sum, s) => sum + s.capacity, 0);

  // Seats that can still be sold (not blocked) per zone, in active sectors.
  const zoneRows = new Map<string | null, { counts: SeatCounts; revenue: number }>();
  for (const s of seated) {
    if (!s.isActive) continue;
    for (const seat of s.seats) {
      const zone = seat.zoneId ? zones.find((z) => z.id === seat.zoneId) : undefined;
      const row = zoneRows.get(zone?.id ?? null) ?? { counts: emptyCounts(), revenue: 0 };
      addSeat(row.counts, seat);
      if (seat.state !== "BLOCKED") row.revenue += zone?.price ?? s.price;
      zoneRows.set(zone?.id ?? null, row);
    }
  }
  const unzoned = zoneRows.get(null);

  const problems = seated
    .filter((s) => s.isActive && s.price <= 0)
    .map((s) => ({ s, missing: s.seats.filter((seat) => !seat.zoneId && seat.state !== "BLOCKED").length }))
    .filter((p) => p.missing > 0);

  return (
    <section className={editorStyles.panelCard} aria-labelledby="summary-title">
      <h2 className={editorStyles.panelTitle} id="summary-title">
        Resumen
      </h2>

      {problems.map(({ s, missing }) => (
        <p key={s.id} className={editorStyles.warn} role="status">
          {s.name}: {n(missing)} asientos no tienen zona y el sector no tiene precio, así que no se pueden vender. Asígnales una zona o ponle precio al sector en
          el evento.
        </p>
      ))}

      <table className={styles.table}>
        <caption className="sr-only">Asientos por sector</caption>
        <thead>
          <tr>
            <th scope="col">Sector</th>
            <th scope="col">Total</th>
            <th scope="col">Libres</th>
            <th scope="col">Vend.</th>
            <th scope="col">Bloq.</th>
          </tr>
        </thead>
        <tbody>
          {bySector.map(({ sector, counts }) => (
            <tr key={sector.id} className={sector.isActive ? undefined : styles.off} title={sector.isActive ? undefined : "Este sector no está a la venta"}>
              <td>
                <span className={styles.cellName}>
                  <span className={styles.dot} style={{ ["--dot" as string]: sector.color }} aria-hidden="true" />
                  <span>{sector.name}</span>
                </span>
              </td>
              <td>{n(counts.total)}</td>
              <td>{n(counts.available)}</td>
              <td>{n(counts.sold + counts.held)}</td>
              <td>{n(counts.blocked)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>A la venta</td>
            <td>{n(total.total)}</td>
            <td>{n(total.available)}</td>
            <td>{n(total.sold + total.held)}</td>
            <td>{n(total.blocked)}</td>
          </tr>
        </tfoot>
      </table>
      {general.length > 0 && (
        <p className={editorStyles.muted}>
          Además, {n(generalCap)} entradas de acceso general en {general.map((s) => s.name).join(", ")}.
        </p>
      )}

      {zoneRows.size > 0 && (
        <table className={styles.table}>
          <caption className="sr-only">Asientos por zona de precio</caption>
          <thead>
            <tr>
              <th scope="col">Zona</th>
              <th scope="col">Asientos</th>
              <th scope="col">Precio</th>
              <th scope="col">Recaudación máx.</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => {
              const row = zoneRows.get(z.id);
              if (!row) return null;
              return (
                <tr key={z.id}>
                  <td>
                    <span className={styles.cellName}>
                      <span className={styles.dot} style={{ ["--dot" as string]: z.color }} aria-hidden="true" />
                      <span>{z.name}</span>
                    </span>
                  </td>
                  <td>{n(row.counts.total - row.counts.blocked)}</td>
                  <td>{currency(z.price)}</td>
                  <td>{currency(row.revenue)}</td>
                </tr>
              );
            })}
            {unzoned && (
              <tr>
                <td>
                  <span className={styles.cellName}>
                    <span className={styles.dot} style={{ ["--dot-stroke" as string]: "#94a3b8" }} aria-hidden="true" />
                    <span>Precio del sector</span>
                  </span>
                </td>
                <td>{n(unzoned.counts.total - unzoned.counts.blocked)}</td>
                <td>—</td>
                <td>{currency(unzoned.revenue)}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <p className={editorStyles.muted}>La recaudación máxima suma el precio de todos los asientos no bloqueados de los sectores a la venta, sin cargo por servicio.</p>
    </section>
  );
}
