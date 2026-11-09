"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/icons";
import { SkeletonList } from "@/components/Skeleton";
import { useCanEdit } from "@/lib/access";
import { DoorStaffUnavailable, ValidationError, fetchDoorStaff, saveDoorStaff, type DoorStaffMember } from "@/lib/validation-data";
import formStyles from "./EventFormPage.module.css";
import styles from "./EventDoorStaff.module.css";

/**
 * The producer picks who validates tickets at this event's door. Those
 * validators only see this event (and any other they're assigned to) in
 * Validación. Saved on its own, like courtesies.
 */
export default function EventDoorStaff({ eventId }: { eventId: string }) {
  const canEdit = useCanEdit("eventos");
  const [members, setMembers] = useState<DoorStaffMember[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, setState] = useState<"ready" | "unavailable" | "error">("ready");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    fetchDoorStaff(eventId)
      .then((list) => {
        if (!active) return;
        setMembers(list);
        setSelected(new Set(list.filter((m) => m.assigned).map((m) => m.user_id)));
        setState("ready");
      })
      .catch((e) => active && setState(e instanceof DoorStaffUnavailable ? "unavailable" : "error"));
    return () => {
      active = false;
    };
  }, [eventId, reload]);

  const initial = useMemo(() => new Set((members ?? []).filter((m) => m.assigned).map((m) => m.user_id)), [members]);
  const dirty = members !== null && (selected.size !== initial.size || [...selected].some((id) => !initial.has(id)));

  const toggle = (id: string) => {
    setSaved(false);
    setSaveError("");
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await saveDoorStaff(eventId, [...selected]);
      setMembers((list) => (list ?? []).map((m) => ({ ...m, assigned: selected.has(m.user_id) })));
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof DoorStaffUnavailable || !(e instanceof ValidationError) ? "No pudimos guardar el equipo de puerta. Inténtalo de nuevo." : e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={formStyles.sec} id="s-puerta" aria-labelledby="h-puerta">
      <div className={formStyles.secHead}>
        <div className={formStyles.secIcon} data-tone="purple" aria-hidden="true">
          <MaterialIcon decorative name="qr_code_scanner" />
        </div>
        <div>
          <h2 className={formStyles.secTitle} id="h-puerta" tabIndex={-1}>
            Equipo de puerta
          </h2>
          <p className={formStyles.secDesc}>
            Elige quién valida las entradas de este evento. Al abrir Validación, cada persona entra directo a su evento asignado. Se guarda aparte de «Guardar cambios».
          </p>
        </div>
      </div>

      {state === "unavailable" ? (
        <p className={styles.notice}>
          <MaterialIcon decorative name="info" />
          Esta opción se activa cuando se aplique la actualización de base de datos del equipo de puerta.
        </p>
      ) : state === "error" ? (
        <div className={styles.notice} role="alert">
          <MaterialIcon decorative name="error" />
          <span>No pudimos cargar el equipo de puerta.</span>
          <button type="button" className={styles.linkButton} onClick={() => setReload((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : members === null ? (
        <SkeletonList rows={3} thumb="none" card={false} label="Cargando equipo de puerta…" />
      ) : members.length === 0 ? (
        <div className={styles.empty}>
          <p>
            Todavía no hay validadores en tu equipo. Crea en <b>Roles</b> un rol con acceso solo a <b>Validación</b>, agrega a las personas con ese rol y vuelve aquí para asignarlas.
          </p>
          <Link href="/roles/" className={styles.linkButton}>
            Ir a Roles
          </Link>
        </div>
      ) : (
        <>
          <ul className={styles.list}>
            {members.map((m) => (
              <li key={m.user_id}>
                <label className={styles.member} data-checked={selected.has(m.user_id) || undefined}>
                  <input type="checkbox" checked={selected.has(m.user_id)} disabled={!canEdit || saving} onChange={() => toggle(m.user_id)} />
                  <span className={styles.avatar} aria-hidden="true">
                    {m.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className={styles.who}>
                    <b>{m.name}</b>
                    <small>
                      {m.email} · {m.role}
                    </small>
                  </span>
                  {selected.has(m.user_id) && <span className={styles.tag}>En este evento</span>}
                </label>
              </li>
            ))}
          </ul>
          {canEdit && (
            <div className={styles.actions}>
              {saved && !dirty && (
                <span className={styles.ok} role="status">
                  <MaterialIcon decorative name="check_circle" /> Equipo guardado
                </span>
              )}
              {saveError && (
                <span className={styles.error} role="alert">
                  {saveError}
                </span>
              )}
              <button type="button" className={`${formStyles.btn} ${formStyles.btnOrange}`} onClick={save} disabled={!dirty || saving}>
                {saving ? "Guardando…" : `Guardar equipo (${selected.size})`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
