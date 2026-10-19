import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "email_change", "magiclink", "invite"];

/** Only paths inside this site, so the link can't bounce the visitor elsewhere. */
function safeNext(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

/**
 * Target of the links in Supabase's e-mails (account confirmation, password
 * recovery, e-mail change): ?token_hash=…&type=…&next=…. The token is checked
 * on the server, so the link works on any device or browser, not only on the
 * one where the person signed up or asked for the e-mail.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const fallback = type === "recovery" ? "/restablecer-contrasena/" : "/mi-cuenta/";
  const next = safeNext(url.searchParams.get("next"), fallback);

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const target = new URL(next, url.origin);
      if (type === "signup" || type === "email") target.searchParams.set("bienvenida", "1");
      return NextResponse.redirect(target);
    }
  }

  // Expired, already used or malformed link.
  const target = new URL(type === "recovery" ? "/recuperar-contrasena/" : "/login-usuario/", url.origin);
  target.searchParams.set("enlace", "invalido");
  return NextResponse.redirect(target);
}
