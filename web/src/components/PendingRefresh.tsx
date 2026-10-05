"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 15;

// Re-renders the server page (which reconciles with Flow) until the order settles.
export default function PendingRefresh() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) return;
    const id = window.setTimeout(() => {
      setAttempts((n) => n + 1);
      router.refresh();
    }, INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [attempts, router]);

  if (attempts < MAX_ATTEMPTS) return null;
  return (
    <p role="status" style={{ fontSize: 13, color: "var(--color-gray-500)", marginBottom: 20 }}>
      Está tardando más de lo normal. Si ya pagaste, tus entradas aparecerán en Mi cuenta apenas Flow confirme.
    </p>
  );
}
