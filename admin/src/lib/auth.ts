const SESSION_KEY = "passo_admin_session";

// Credenciales de prueba temporales para enlazar login -> inicio mientras no hay backend.
const DEMO_EMAIL = "admin@uxoraestudio.com";
const DEMO_PASSWORD = "Uxora2026";

export function login(email: string, password: string): boolean {
  const ok = email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
  if (ok && typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, "1");
  }
  return ok;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function logout() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
