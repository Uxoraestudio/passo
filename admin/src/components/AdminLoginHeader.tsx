"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandProvider";
import styles from "./AdminLoginHeader.module.css";

export default function AdminLoginHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} aria-label="Aforiq, ir al inicio">
          <BrandLogo imageClassName={styles.logoImage} />
        </Link>
        <p className={styles.helpHint}>
          ¿Necesitas credenciales? <a href="#">Solicitar acceso a TI</a>
        </p>
      </div>
    </header>
  );
}
