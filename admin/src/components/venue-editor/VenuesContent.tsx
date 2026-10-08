"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useCanEdit } from "@/lib/access";
import { createVenue, listVenues, type Venue } from "@/lib/venues-data";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import pageStyles from "@/app/inicio/page.module.css";
import tableStyles from "@/components/dashboard/SalesContent.module.css";
import styles from "./VenueEditor.module.css";

type MapRow = { venue_id: string; version: number; status: "draft" | "published" };

const templateLabel: Record<string, string> = { arena: "Plantilla arena", teatro: "Plantilla teatro", estadio: "Plantilla estadio", custom: "Personalizado" };

function planStatus(maps: MapRow[]) {
  const published = maps.filter((m) => m.status === "published").sort((a, b) => b.version - a.version)[0];
  const draft = maps.find((m) => m.status === "draft");
  if (!published && !draft) return { label: "Sin plano", tone: "none" };
  if (published && draft) return { label: `Publicado v${published.version} · borrador v${draft.version}`, tone: "published" };
  if (published) return { label: `Publicado v${published.version}`, tone: "published" };
  return { label: `Borrador v${draft!.version}`, tone: "draft" };
}

export default function VenuesContent() {
  const router = useRouter();
  const canEdit = useCanEdit("eventos");
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [maps, setMaps] = useState<MapRow[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", address: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, mapRows] = await Promise.all([listVenues(), createClient().from("venue_maps").select("venue_id, version, status")]);
      setVenues(list);
      setMaps((mapRows.data ?? []) as MapRow[]);
      setError("");
    } catch {
      setError("No pudimos cargar los recintos. Revisa tu conexión e inténtalo de nuevo.");
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const submit = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      setFormError("Ingresa el nombre y la ciudad del recinto.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const venue = await createVenue({ name: form.name.trim(), city: form.city.trim(), address: form.address });
      router.push(`/recintos/${venue.id}/plano/`);
    } catch {
      setFormError("No pudimos crear el recinto. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.heroRow}>
        <div>
          <h1 className={pageStyles.pageTitle}>Recintos</h1>
          <p className={pageStyles.pageSubtitle}>Cada recinto tiene su plano de sectores y asientos, que reutilizas en todos sus eventos.</p>
        </div>
        {canEdit && (
          <div className={pageStyles.heroActions}>
            <button type="button" className={pageStyles.createButton} onClick={() => setCreating(true)}>
              <MaterialIcon decorative name="add" />
              Nuevo recinto
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className={pageStyles.stateCard} role="alert">
          <p>{error}</p>
          <button type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : !venues ? (
        <div className={pageStyles.stateCard} aria-busy="true">
          <p>Cargando recintos…</p>
        </div>
      ) : (
        <section className={tableStyles.card} aria-label="Listado de recintos">
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Recinto</th>
                  <th>Origen</th>
                  <th>Plano</th>
                  <th className={tableStyles.num}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => {
                  const status = planStatus(maps.filter((m) => m.venue_id === v.id));
                  return (
                    <tr key={v.id}>
                      <td>
                        <span className={tableStyles.buyer}>{v.name}</span>
                        <span className={tableStyles.sub}>{[v.address, v.city].filter(Boolean).join(", ")}</span>
                      </td>
                      <td>{templateLabel[v.layout_key] ?? v.type}</td>
                      <td>
                        <span className={styles.status} data-status={status.tone}>
                          {status.label}
                        </span>
                      </td>
                      <td className={tableStyles.num}>
                        <Link href={`/recintos/${v.id}/plano/`} className={styles.secondaryButton}>
                          {status.tone === "none" ? (canEdit ? "Crear plano" : "Ver") : "Abrir plano"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={creating}
        kind="form"
        icon="stadium"
        title="Nuevo recinto"
        busy={saving}
        onClose={() => setCreating(false)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setCreating(false) },
          { label: "Crear y abrir plano", variant: "primary", onClick: submit, busyLabel: "Creando…" },
        ]}
      >
        <div className={styles.panelCard} style={{ border: 0, padding: 0, marginTop: 12 }}>
          <label className={styles.field}>
            <span>Nombre</span>
            <input data-autofocus value={form.name} maxLength={80} placeholder="Ej: Teatro Municipal de Viña" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Ciudad</span>
              <input value={form.city} maxLength={60} placeholder="Ej: Viña del Mar" onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
          </div>
          <label className={styles.field}>
            <span>Dirección (opcional)</span>
            <input value={form.address} maxLength={120} placeholder="Ej: Av. Libertad 250" onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          {formError && (
            <p role="alert" style={{ color: "#b42318", fontSize: 13, fontWeight: 600 }}>
              {formError}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </main>
  );
}
