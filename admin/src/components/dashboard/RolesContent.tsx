"use client";

import { useCallback, useEffect, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import Select from "@/components/Select";
import { SkeletonList, SkeletonTable } from "@/components/Skeleton";
import { MODULES, useAccess, useCanEdit, type ModuleKey, type PermissionLevel } from "@/lib/access";
import {
  OWNER_ROLE_NAME,
  deleteRole,
  fetchTeam,
  formatDate,
  inviteTeamMember,
  removeTeamMember,
  saveRole,
  setMember,
  type StaffRole,
  type TeamMember,
} from "@/lib/admin-data";
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

/** Sections a productora's team can never enter, whatever its role says. */
const PLATFORM_ONLY: ModuleKey[] = ["apariencia", "seo"];

function summary(role: StaffRole, modules: readonly (typeof MODULES)[number][]) {
  const editable = modules.filter((m) => role.permissions[m.key] === "edit").map((m) => m.label);
  const viewable = modules.filter((m) => role.permissions[m.key] === "view").map((m) => m.label);
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
  const orgId = access.organization?.id ?? null;
  // A productora's team: invitations, its owner role locked, no Apariencia/SEO.
  const isProductora = orgId !== null;
  const modules = isProductora ? MODULES.filter((m) => !PLATFORM_ONLY.includes(m.key)) : MODULES;

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
      const team = await fetchTeam(orgId);
      setMembers(team.members);
      setRoles(team.roles);
      setLoadError("");
    } catch {
      setLoadError("No pudimos cargar el equipo. Revisa tu conexión e inténtalo de nuevo.");
    }
  }, [orgId]);

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
      if (removesAccount(memberToRemove)) await removeTeamMember(memberToRemove.id);
      else await setMember(memberToRemove.email, "cliente", null);
      await load();
      flash(
        "ok",
        memberToRemove.pending
          ? `Cancelamos la invitación a ${memberToRemove.email}.`
          : `${memberToRemove.full_name || memberToRemove.email} ya no tiene acceso al panel.`
      );
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
      if (isProductora) {
        const status = await inviteTeamMember(newEmail, newAccess === FULL ? null : newAccess);
        await load();
        flash(
          "ok",
          status === "resent"
            ? `Volvimos a enviar la invitación a ${newEmail.trim()}.`
            : `Enviamos la invitación a ${newEmail.trim()}. Podrá entrar al panel cuando cree su contraseña.`
        );
      } else {
        if (newAccess === ADMIN) await setMember(newEmail, "admin", null);
        else await setMember(newEmail, "staff", newAccess === FULL ? null : newAccess);
        await load();
        flash("ok", `${newEmail.trim()} ahora tiene acceso al panel.`);
      }
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

  const resend = async (m: TeamMember) => {
    setBusyId(m.id);
    try {
      await inviteTeamMember(m.email, m.staff_role_id);
      flash("ok", `Volvimos a enviar la invitación a ${m.email}.`);
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "No pudimos reenviar la invitación.");
    } finally {
      setBusyId(null);
    }
  };

  // The owner role is the platform's to manage; a productora can't assign it, edit it or take it away.
  const ownerRoleId = isProductora ? roles.find((r) => r.name === OWNER_ROLE_NAME)?.id : undefined;
  const isOwner = (m: TeamMember) => ownerRoleId !== undefined && m.staff_role_id === ownerRoleId;
  // A productora's panel-only account is deleted when it leaves the team; a customer keeps theirs.
  const removesAccount = (m: TeamMember) => isProductora && m.account_type === "productora";

  const membersWith = (roleId: string) => (members ?? []).filter((m) => m.role === "staff" && m.staff_role_id === roleId).length;
  const admins = (members ?? []).filter((m) => m.role === "admin").length;

  const accessOptions = (includeAdmin: boolean) => [
    ...(includeAdmin ? [{ value: ADMIN, label: "Administrador" }] : []),
    { value: FULL, label: "Equipo · acceso completo" },
    ...roles.filter((r) => r.id !== ownerRoleId).map((r) => ({ value: r.id, label: r.name })),
  ];

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
        <>
          <SkeletonTable rows={5} columns={4} label="Cargando equipo…" />
          <SkeletonList rows={3} thumb="none" label="Cargando roles…" />
        </>
      ) : (
        <>
          <section className={tableStyles.card} aria-labelledby="equipo">
            <h3 id="equipo" className={tableStyles.cardTitle}>
              Equipo con acceso al panel
            </h3>
            <p className={tableStyles.cardSubtitle}>
              {members.length} {members.length === 1 ? "persona" : "personas"}.{" "}
              {isProductora
                ? "Para sumar a alguien, invítalo por correo: tendrá una cuenta solo para el panel de tu productora."
                : "Para sumar a alguien, primero debe tener una cuenta en Aforiq."}
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
                    const locked = lockedAdmin || isOwner(m);
                    return (
                      <tr key={m.id}>
                        <td>
                          <span className={tableStyles.buyer}>{m.pending ? m.email : m.full_name || "Sin nombre"}</span>
                          {m.pending ? (
                            <span className={styles.pendingRow}>
                              <span className={styles.pending}>Invitación pendiente</span>
                              {canEdit && isProductora && !isOwner(m) && (
                                <button type="button" className={styles.linkButton} onClick={() => resend(m)} disabled={busyId === m.id}>
                                  {busyId === m.id ? "Enviando…" : "Reenviar"}
                                </button>
                              )}
                            </span>
                          ) : (
                            <span className={tableStyles.sub}>{m.email}</span>
                          )}
                        </td>
                        <td>
                          {canEdit && !locked ? (
                            <div className={tableStyles.eventSelect}>
                              <Select
                                size="sm"
                                width="auto"
                                aria-label={`Acceso de ${m.full_name || m.email}`}
                                value={accessValue(m)}
                                disabled={busyId === m.id}
                                onChange={(v) => applyAccess(m, v)}
                                options={accessOptions(isAdmin)}
                              />
                            </div>
                          ) : (
                            <span className={styles.badge} data-admin={m.role === "admin"} title={isOwner(m) ? "Dueño de la productora. Lo gestiona Aforiq." : undefined}>
                              {m.role === "admin" ? "Administrador" : roles.find((r) => r.id === m.staff_role_id)?.name ?? "Equipo · acceso completo"}
                            </span>
                          )}
                        </td>
                        <td>{formatDate(m.created_at)}</td>
                        {canEdit && (
                          <td className={tableStyles.num}>
                            {!locked && (
                              <button
                                type="button"
                                className={styles.linkDanger}
                                onClick={() => setMemberToRemove(m)}
                                aria-label={m.pending ? `Cancelar la invitación a ${m.email}` : `Quitar el acceso de ${m.full_name || m.email}`}
                              >
                                {m.pending ? "Cancelar" : "Quitar acceso"}
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
              {!isProductora && (
                <article className={styles.roleCard} style={{ "--role": "#110d29" } as React.CSSProperties}>
                  <div className={styles.roleTop}>
                    <span className={styles.roleDot} aria-hidden="true" />
                    <h3>Administrador</h3>
                    <span className={styles.roleCount}>{admins}</span>
                  </div>
                  <p>Acceso total, incluida la gestión de administradores. No se puede editar.</p>
                </article>
              )}
              <article className={styles.roleCard} style={{ "--role": "#94a3b8" } as React.CSSProperties}>
                <div className={styles.roleTop}>
                  <span className={styles.roleDot} aria-hidden="true" />
                  <h3>Equipo · acceso completo</h3>
                  <span className={styles.roleCount}>{members.filter((m) => m.role === "staff" && !m.staff_role_id).length}</span>
                </div>
                <p>
                  {isProductora
                    ? "Puede ver y editar todas las secciones de la productora."
                    : "Puede ver y editar todas las secciones, excepto otorgar el nivel de administrador."}
                </p>
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
                  <p className={styles.roleSummary}>{summary(role, modules)}</p>
                  {role.id === ownerRoleId ? (
                    <p className={styles.roleLocked}>
                      <MaterialIcon decorative name="lock" />
                      Rol del dueño. Lo gestiona Aforiq.
                    </p>
                  ) : canEdit && (
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
                {modules.map((m) => {
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
          {
            label: isProductora ? "Enviar invitación" : "Dar acceso",
            variant: "primary",
            onClick: addMember,
            busyLabel: isProductora ? "Enviando…" : "Guardando…",
          },
        ]}
      >
        <div className={styles.form}>
          <p>
            {isProductora
              ? "Le enviaremos una invitación para que cree su contraseña. Es una cuenta solo para el panel de tu productora: no puede ser un correo con el que compra entradas en Aforiq."
              : "La persona debe haberse registrado antes en Aforiq con este correo."}
          </p>
          <label className={styles.field}>
            <span>{isProductora ? "Correo" : "Correo de la cuenta"}</span>
            <input data-autofocus type="email" value={newEmail} placeholder="nombre@empresa.cl" onChange={(e) => setNewEmail(e.target.value)} />
          </label>
          <div className={styles.field}>
            <span aria-hidden="true">Acceso</span>
            <Select aria-label="Acceso" value={newAccess} onChange={setNewAccess} options={accessOptions(isAdmin)} />
          </div>
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
        title={memberToRemove?.pending ? "¿Cancelar la invitación?" : "¿Quitar acceso al panel?"}
        busy={savingMember}
        onClose={() => setMemberToRemove(null)}
        actions={[
          { label: memberToRemove?.pending ? "Volver" : "Cancelar", variant: "soft", onClick: () => setMemberToRemove(null), autoFocus: true },
          {
            label: memberToRemove?.pending ? "Cancelar invitación" : "Quitar acceso",
            variant: "danger",
            onClick: removeMember,
            busyLabel: "Quitando…",
          },
        ]}
      >
        <p>
          {memberToRemove && removesAccount(memberToRemove) ? (
            memberToRemove.pending ? (
              <>
                El enlace que le enviamos a <b>{memberToRemove.email}</b> dejará de funcionar.
              </>
            ) : (
              <>
                Se elimina la cuenta del panel de <b>{memberToRemove.full_name || memberToRemove.email}</b>. Si vuelves a necesitarla, invítala de
                nuevo.
              </>
            )
          ) : (
            <>
              <b>{memberToRemove?.full_name || memberToRemove?.email}</b> seguirá teniendo su cuenta de cliente, pero ya no podrá entrar al panel.
            </>
          )}
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
