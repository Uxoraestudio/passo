"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandProvider";
import styles from "./AdminLoginHeader.module.css";

// The public site, where productoras ask to sell with Aforiq.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://aforiq.cl").replace(/\/$/, "");

export default function AdminLoginHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} aria-label="Aforiq, ir al inicio">
          <BrandLogo imageClassName={styles.logoImage} />
        </Link>
        <p className={styles.helpHint}>
          ¿Necesitas credenciales de productora? <a href={`${SITE_URL}/organizadores/`}>Solicitar acceso</a>
        </p>
      </div>
    </header>
  );
}
