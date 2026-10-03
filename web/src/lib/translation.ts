export const SOURCE_LANGUAGE = "es";
export const TRANSLATED_LANGUAGES = ["en", "pt", "it"] as const;

const COOKIE = "googtrans";

export function readLanguage(): string {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([a-z-]+)/i);
  const code = match?.[1];
  return code && (TRANSLATED_LANGUAGES as readonly string[]).includes(code) ? code : SOURCE_LANGUAGE;
}

function writeCookie(value: string, maxAge: number) {
  const { hostname } = window.location;
  const base = `${COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = base;
  // Google's script may also set the cookie on the parent domain; keep both in sync.
  if (hostname.includes(".")) document.cookie = `${base}; domain=.${hostname}`;
}

export function applyLanguage(code: string) {
  if (code === SOURCE_LANGUAGE) {
    writeCookie("", 0);
  } else {
    writeCookie(`/${SOURCE_LANGUAGE}/${code}`, 60 * 60 * 24 * 365);
  }
  window.location.reload();
}
