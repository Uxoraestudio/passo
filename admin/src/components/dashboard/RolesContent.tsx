"use client";

import { useCallback, useEffect, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { MODULES, useAccess, useCanEdit, type ModuleKey, type PermissionLevel } from "@/lib/access";
import { deleteRole, fetchTeam, formatDate, saveRole, setMember, type StaffRole, type TeamMember } from "@/lib/admin-data";
import ConfirmDialog from "./ConfirmDialog";
import pageStyles from "@/app/inicio/page.module.css";
import tableStyles from "./SalesContent.module.css";
import styles from "./RolesContent.module.css";

const COLORS = ["#6534f5", "#ff782d", "#0d9488", "#db2777", "#2563eb", "#64748b"];
const LEVELS: { id: PermissionLevel; label: string }[] = [
  { id: "none", label: "Sin acceso" },
  { id: "view", label: "Ver" },
  { id: "edit", label: "Editar" },
];
const FULL = "__full__";
const ADMIN = "__admin__";

type RoleDraft = { id?: string; name: string; description: string; color: string; permissions: Partial<Record<ModuleKey, PermissionLevel>> };

const emptyRole = (): RoleDraft => ({
  name: "",
  description: "",
  color: COLORS[0],
  permissions: { resumen: "view", eventos: "view" },
});

function summary(role: StaffRole) {
  const editable = MODULES.filter((m) => role.permissions[m.key] === "edit").map((m) => m.label);
  const viewable = MODULES.filter((m) => role.permissions[m.key] === "view").map((m) => m.label);
  if (editable.length === 0 && viewable.length === 0) return "Sin acceso a ninguna sección";
  return [editable.length ? `Edita: ${editable.join(", ")}` : null, viewable.length ? `Ve: ${viewable.join(", ")}` : null].filter(Boolean).join(" · ");
}

function accessValue(m: TeamMember) {
  if (m.role === "admin") return ADMIN;
  return m.staff_role_id ?? FULL;
}

export default function RolesContent() {
  const access = useAccess();
  const canEdit = useCanEdit("roles");
  const isAdmin = access.role === "admin";

  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null);
  const [roleError, setRoleError] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<StaffRole | null>(null);

  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newAccess, setNewAccess] = useState(FULL);
  const [addError, setAddError] = useState("");
  const [savingMember, setSavingMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    try {
      const team = await fetchTeam();
      setMembers(team.members);
      setRoles(team.roles);
      setLoadError("");
    } catch {
      setLoadError("No pudimos cargar el equipo. Revisa tu conexión e inténtalo de nuevo.");
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const flash = (tone: "ok" | "error", text: string) => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 4000);
  };

  const applyAccess = async (member: TeamMember, value: string) => {
    setBusyId(member.id);
    try {
      if (value === ADMIN) await setMember(member.email, "admin", null);
      else await setMember(member.email, "staff", value === FULL ? null : value);
      await load();
      flash("ok", `Acceso de ${member.full_name || member.email} actualizado.`);
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "No pudimos actualizar el acceso.");
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async () => {
    if (!memberToRemove) return;
    setSavingMember(true);
    try {
      await setMember(memberToRemove.email, "cliente", null);
      await load();
      flash("ok", `${memberToRemove.full_name || memberToRemove.email} ya no tiene acceso al panel.`);
      setMemberToRemove(null);
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "No pudimos quitar el acceso.");
      setMemberToRemove(null);
    } finally {
      setSavingMember(false);
    }
  };

  const addMember = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail.trim())) {
      setAddError("Ingresa un correo válido.");
      return;
    }
    setSavingMember(true);
    setAddError("");
    try {
      if (newAccess === ADMIN) await setMember(newEmail, "admin", null);
      else await setMember(newEmail, "staff", newAccess === FULL ? null : newAccess);
      await load();
      flash("ok", `${newEmail.trim()} ahora tiene acceso al panel.`);
      setAdding(false);
      setNewEmail("");
      setNewAccess(FULL);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "No pudimos agregar a esta persona.");
    } finally {
      setSavingMember(false);
    }
  };

  const submitRole = async () => {
    if (!roleDraft) return;
    if (!roleDraft.name.trim()) {
      setRoleError("Ponle un nombre al rol.");
      return;
    }
    setSavingRole(true);
    setRoleError("");
    try {
      await saveRole(roleDraft);
      await load();
      flash("ok", roleDraft.id ? `Rol «${roleDraft.name.trim()}» actualizado.` : `Rol «${roleDraft.name.trim()}» creado.`);
      setRoleDraft(null);
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : "No pudimos guardar el rol.");
    } finally {
      setSavingRole(false);
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setSavingRole(true);
    try {
      await deleteRole(roleToDelete.id);
      await load();
      flash("ok", `Rol «${roleToDelete.name}» eliminado.`);
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "No pudimos eliminar el rol.");
    } finally {
      setRoleToDelete(null);
      setSavingRole(false);
    }
  };

  const membersWith = (roleId: string) => (members ?? []).filter((m) => m.role === "staff" && m.staff_role_id === roleId).length;
  const admins = (members ?? []).filter((m) => m.role === "admin").length;

  const accessOptions = (includeAdmin: boolean) => (
    <>
      {includeAdmin && <option value={ADMIN}>Administrador</option>}
      <option value={FULL}>Staff · acceso completo</option>
      {roles.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </>
  );

  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.heroRow}>
        <div>
          <h1 className={pageStyles.pageTitle}>Roles y equipo</h1>
          <p className={pageStyles.pageSubtitle}>Quién entra al panel y qué puede ver o editar en cada sección.</p>
        </div>
        {canEdit && (
          <div className={pageStyles.heroActions}>
            <button type="button" className={tableStyles.exportButton} onClick={() => setRoleDraft(emptyRole())}>
              <MaterialIcon decorative name="add_moderator" />
              Crear rol
            </button>
            <button
              type="button"
              className={pageStyles.createButton}
              onClick={() => {
                setAdding(true);
                setAddError("");
              }}
            >
              <MaterialIcon decorative name="person_add" />
              Agregar miembro
            </button>
          </div>
        )}
      </div>

      <div className={styles.notice} role="status" aria-live="polite" data-tone={notice?.tone}>
        {notice?.text}
      </div>

      {loadError ? (
        <div className={pageStyles.stateCard} role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : !members ? (
        <div className={pageStyles.stateCard} aria-busy="true">
          <p>Cargando equipo…</p>
        </div>
      ) : (
        <>
          <section className={tableStyles.card} aria-labelledby="equipo">
            <h3 id="equipo" className={tableStyles.cardTitle}>
              Equipo con acceso al panel
            </h3>
            <p className={tableStyles.cardSubtitle}>
              {members.length} {members.length === 1 ? "persona" : "personas"}. Para sumar a alguien, primero debe tener una cuenta en Passo.
            </p>
            <div className={tableStyles.tableWrap}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Acceso</th>
                    <th>Miembro desde</th>
                    {canEdit && <th className={tableStyles.num}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const lockedAdmin = m.role === "admin" && (!isAdmin || admins <= 1);
                    return (
                      <tr key={m.id}>
                        <td>
                          <span className={tableStyles.buyer}>{m.full_name || "Sin nombre"}</span>
                          <span className={tableStyles.sub}>{m.email}</span>
                        </td>
                        <td>
                          {canEdit && !lockedAdmin ? (
                            <label className={tableStyles.eventSelect}>
                              <span className="sr-only">Acceso de {m.full_name || m.email}</span>
                              <select value={accessValue(m)} disabled={busyId === m.id} onChange={(e) => applyAccess(m, e.target.value)}>
                                {accessOptions(isAdmin)}
                              </select>
                            </label>
                          ) : (
                            <span className={styles.badge} data-admin={m.role === "admin"}>
                              {m.role === "admin" ? "Administrador" : roles.find((r) => r.id === m.staff_role_id)?.name ?? "Staff · acceso completo"}
                            </span>
                          )}
                        </td>
                        <td>{formatDate(m.created_at)}</td>
                        {canEdit && (
                          <td className={tableStyles.num}>
                            {!lockedAdmin && (
                              <button type="button" className={styles.linkDanger} onClick={() => setMemberToRemove(m)}>
                                Quitar acceso
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="roles-titulo">
            <h2 id="roles-titulo" className={styles.sectionTitle}>
              Roles
            </h2>
            <div className={styles.roleGrid}>
              <article className={styles.roleCard} style={{ "--role": "#110d29" } as React.CSSProperties}>
                <div className={styles.roleTop}>
                  <span className={styles.roleDot} aria-hidden="true" />
                  <h3>Administrador</h3>
                  <span className={styles.roleCount}>{admins}</span>
                </div>
                <p>Acceso total, incluida la gestión de administradores. No se puede editar.</p>
              </article>
              <article className={styles.roleCard} style={{ "--role": "#94a3b8" } as React.CSSProperties}>
                <div className={styles.roleTop}>
                  <span className={styles.roleDot} aria-hidden="true" />
                  <h3>Staff · acceso completo</h3>
                  <span className={styles.roleCount}>{members.filter((m) => m.role === "staff" && !m.staff_role_id).length}</span>
                </div>
                <p>Puede ver y editar todas las secciones, excepto otorgar el nivel de administrador.</p>
              </article>
              {roles.map((role) => (
                <article key={role.id} className={styles.roleCard} style={{ "--role": role.color } as React.CSSProperties}>
                  <div className={styles.roleTop}>
                    <span className={styles.roleDot} aria-hidden="true" />
                    <h3>{role.name}</h3>
                    <span className={styles.roleCount} aria-label={`${membersWith(role.id)} miembros`}>
                      {membersWith(role.id)}
                    </span>
                  </div>
                  {role.description && <p>{role.description}</p>}
                  <p className={styles.roleSummary}>{summary(role)}</p>
                  {canEdit && (
                    <div className={styles.roleActions}>
                      <button
                        type="button"
                        onClick={() => {
                          setRoleDraft({ ...role, permissions: { ...role.permissions } });
                          setRoleError("");
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className={styles.linkDanger} onClick={() => setRoleToDelete(role)}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {canEdit && (
                <button type="button" className={styles.newRole} onClick={() => setRoleDraft(emptyRole())}>
                  <MaterialIcon decorative name="add" />
                  Crear un rol personalizado
                </button>
              )}
            </div>
          </section>
        </>
      )}

      <ConfirmDialog
        open={roleDraft !== null}
        kind="form"
        wide
        icon="shield_person"
        title={roleDraft?.id ? "Editar rol" : "Crear rol"}
        busy={savingRole}
        onClose={() => setRoleDraft(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setRoleDraft(null) },
          { label: roleDraft?.id ? "Guardar cambios" : "Crear rol", variant: "primary", onClick: submitRole, busyLabel: "Guardando…" },
        ]}
      >
        {roleDraft && (
          <div className={styles.form}>
            <label className={styles.field}>
              <span>Nombre</span>
              <input
                data-autofocus
                value={roleDraft.name}
                maxLength={40}
                placeholder="Ej: Operador de puerta"
                onChange={(e) => setRoleDraft({ ...roleDraft, name: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Descripción (opcional)</span>
              <input
                value={roleDraft.description}
                maxLength={140}
                placeholder="Qué hace esta persona en el equipo"
                onChange={(e) => setRoleDraft({ ...roleDraft, description: e.target.value })}
              />
            </label>
            <fieldset className={styles.colors}>
              <legend>Color</legend>
              {COLORS.map((color) => (
                <label key={color} style={{ "--swatch": color } as React.CSSProperties}>
                  <input type="radio" name="role-color" checked={roleDraft.color === color} onChange={() => setRoleDraft({ ...roleDraft, color })} />
                  <span className="sr-only">{color}</span>
                </label>
              ))}
            </fieldset>
            <table className={styles.matrix}>
              <caption>Permisos por sección</caption>
              <thead>
                <tr>
                  <th scope="col">Sección</th>
                  {LEVELS.map((l) => (
                    <th key={l.id} scope="col">
                      {l.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => {
                  const current = roleDraft.permissions[m.key] ?? "none";
                  return (
                    <tr key={m.key}>
                      <th scope="row">{m.label}</th>
                      {LEVELS.map((l) => (
                        <td key={l.id}>
                          <input
                            type="radio"
                            name={`perm-${m.key}`}
                            checked={current === l.id}
                            aria-label={`${m.label}: ${l.label}`}
                            onChange={() => setRoleDraft({ ...roleDraft, permissions: { ...roleDraft.permissions, [m.key]: l.id } })}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {roleDraft.permissions.roles === "edit" && (
              <p className={styles.hint}>Con «Roles: Editar» esta persona podrá dar acceso al panel a otras cuentas (pero no el nivel de administrador).</p>
            )}
            {roleError && (
              <p className={styles.error} role="alert">
                {roleError}
              </p>
            )}
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={adding}
        kind="form"
        icon="person_add"
        title="Agregar miembro al equipo"
        busy={savingMember}
        onClose={() => setAdding(false)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setAdding(false) },
          { label: "Dar acceso", variant: "primary", onClick: addMember, busyLabel: "Guardando…" },
        ]}
      >
        <div className={styles.form}>
          <p>La persona debe haberse registrado antes en Passo con este correo.</p>
          <label className={styles.field}>
            <span>Correo de la cuenta</span>
            <input data-autofocus type="email" value={newEmail} placeholder="nombre@empresa.cl" onChange={(e) => setNewEmail(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Acceso</span>
            <select value={newAccess} onChange={(e) => setNewAccess(e.target.value)}>
              {accessOptions(isAdmin)}
            </select>
          </label>
          {addError && (
            <p className={styles.error} role="alert">
              {addError}
            </p>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={memberToRemove !== null}
        icon="person_remove"
        title="¿Quitar acceso al panel?"
        busy={savingMember}
        onClose={() => setMemberToRemove(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setMemberToRemove(null), autoFocus: true },
          { label: "Quitar acceso", variant: "danger", onClick: removeMember, busyLabel: "Quitando…" },
        ]}
      >
        <p>
          <b>{memberToRemove?.full_name || memberToRemove?.email}</b> seguirá teniendo su cuenta de cliente, pero ya no podrá entrar al panel.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={roleToDelete !== null}
        icon="delete"
        title={`¿Eliminar el rol «${roleToDelete?.name ?? ""}»?`}
        busy={savingRole}
        onClose={() => setRoleToDelete(null)}
        actions={
          roleToDelete && membersWith(roleToDelete.id) > 0
            ? [{ label: "Entendido", variant: "soft", onClick: () => setRoleToDelete(null), autoFocus: true }]
            : [
                { label: "Cancelar", variant: "soft", onClick: () => setRoleToDelete(null), autoFocus: true },
                { label: "Eliminar rol", variant: "danger", onClick: confirmDeleteRole, busyLabel: "Eliminando…" },
              ]
        }
      >
        <p>
          {roleToDelete && membersWith(roleToDelete.id) > 0
            ? `${membersWith(roleToDelete.id)} ${membersWith(roleToDelete.id) === 1 ? "persona tiene" : "personas tienen"} este rol. Cámbiales el rol en la tabla de equipo antes de eliminarlo.`
            : "Nadie tiene este rol asignado. Esta acción no se puede deshacer."}
        </p>
      </ConfirmDialog>
    </main>
  );
}
