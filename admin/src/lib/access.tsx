"use client";

import { createContext, useContext } from "react";

export const MODULES = [
  { key: "resumen", label: "Resumen", href: "/inicio/" },
  { key: "eventos", label: "Eventos", href: "/eventos/" },
  { key: "ventas", label: "Ventas y reportes", href: "/ventas/" },
  { key: "validacion", label: "Validación", href: "/validar-ticket/" },
  { key: "clientes", label: "Clientes", href: "/clientes/" },
  { key: "roles", label: "Roles", href: "/roles/" },
  { key: "apariencia", label: "Apariencia", href: "/apariencia/" },
  { key: "seo", label: "SEO", href: "/seo/" },
  { key: "configuracion", label: "Configuración", href: "/configuracion/" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];
export type PermissionLevel = "none" | "view" | "edit";

export type Access = {
  role: "admin" | "staff";
  staffRoleName: string | null;
  /** null = full access (admins, and staff without a custom role). */
  permissions: Partial<Record<ModuleKey, PermissionLevel>> | null;
};

const rank: Record<PermissionLevel, number> = { none: 0, view: 1, edit: 2 };

export function levelOf(access: Access, module: ModuleKey): PermissionLevel {
  if (!access.permissions) return "edit";
  return access.permissions[module] ?? "none";
}

export function allows(access: Access, module: ModuleKey, level: Exclude<PermissionLevel, "none"> = "view") {
  return rank[levelOf(access, module)] >= rank[level];
}

export function firstAllowedHref(access: Access): string | null {
  return MODULES.find((m) => allows(access, m.key))?.href ?? null;
}

export const AccessContext = createContext<Access | null>(null);

export function useAccess(): Access {
  const access = useContext(AccessContext);
  if (!access) throw new Error("useAccess must be used inside <AuthGuard>.");
  return access;
}

/** Whether the current user can edit `module`. */
export function useCanEdit(module: ModuleKey) {
  return allows(useAccess(), module, "edit");
}
