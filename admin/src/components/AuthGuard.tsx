"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authed = useSyncExternalStore(subscribe, isAuthenticated, getServerSnapshot);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login-admin/");
    }
  }, [authed, router]);

  if (!authed) return null;

  return <>{children}</>;
}
