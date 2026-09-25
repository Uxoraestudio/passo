"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "authorized" | "unauthorized";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (active) setStatus("unauthorized");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();

      const authorized = profile?.role === "admin" || profile?.role === "staff";
      if (active) setStatus(authorized ? "authorized" : "unauthorized");
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status === "unauthorized") {
      router.replace("/login-admin/");
    }
  }, [status, router]);

  if (status !== "authorized") return null;

  return <>{children}</>;
}
