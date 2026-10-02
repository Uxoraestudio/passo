"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./AccountNav.module.css";

export type AccountSection = "entradas" | "favoritos" | "datos" | "pagos" | "notificaciones";

const stroke = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ITEMS: { id: AccountSection; label: string; icon: ReactNode }[] = [
  {
    id: "entradas",
    label: "Mis entradas",
    icon: <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2ZM14 6v12" {...stroke} />,
  },
  {
    id: "favoritos",
    label: "Favoritos",
    icon: <path d="M12 19.5s-7.5-4.3-7.5-9.7A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6c0 5.4-7.5 9.7-7.5 9.7Z" {...stroke} />,
  },
  {
    id: "datos",
    label: "Datos personales",
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.5" {...stroke} />
        <path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" {...stroke} />
      </>
    ),
  },
  {
    id: "pagos",
    label: "Métodos de pago",
    icon: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="2.5" {...stroke} />
        <path d="M3.5 10h17M7.5 14.5h3" {...stroke} />
      </>
    ),
  },
  {
    id: "notificaciones",
    label: "Notificaciones",
    icon: <path d="M6.5 16.5V11a5.5 5.5 0 1 1 11 0v5.5l1.5 1.5H5l1.5-1.5ZM10 20.5h4" {...stroke} />,
  },
];

export default function AccountNav({
  name,
  email,
  initials,
  active,
}: {
  name: string;
  email: string;
  initials: string;
  active: AccountSection;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className={styles.card}>
      <div className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <div className={styles.identity}>
          <p className={styles.name}>{name}</p>
          <p className={styles.email}>{email}</p>
        </div>
      </div>

      <nav aria-label="Mi cuenta">
        <ul className={styles.list}>
          {ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                href={item.id === "entradas" ? "/mi-cuenta/" : `/mi-cuenta/?seccion=${item.id}`}
                className={styles.item}
                aria-current={active === item.id ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button type="button" className={styles.signOut} onClick={signOut} disabled={signingOut}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14 5.5H7A1.5 1.5 0 0 0 5.5 7v10A1.5 1.5 0 0 0 7 18.5h7M11 12h9m0 0-3-3m3 3-3 3" {...stroke} />
        </svg>
        {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    </aside>
  );
}
