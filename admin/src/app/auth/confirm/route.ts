import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["invite", "recovery", "magiclink", "email"];

/**
 * Target of the panel's e-mail links (?token_hash=…&type=…), today the
 * invitation of a productora's owner. The token is checked on the server, so
 * the link works on any device. Invitations go on to choose a password.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const next = type === "invite" || type === "recovery" ? "/crear-contrasena/" : "/inicio/";
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // Expired, already used or malformed link.
  const target = new URL("/login-admin/", url.origin);
  target.searchParams.set("enlace", "invalido");
  return NextResponse.redirect(target);
}
