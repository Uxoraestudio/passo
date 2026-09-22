"use client";

import { useState } from "react";
import { DesktopIcon, MobileIcon, SearchIcon } from "@/components/icons";
import { defaultColors, type ColorFieldId } from "@/lib/appearance-data";
import styles from "./AppearancePreview.module.css";

type Colors = Record<ColorFieldId, string>;

export default function AppearancePreview({ colors }: { colors: Colors }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [version, setVersion] = useState<"original" | "personalizado">("personalizado");

  const active = version === "personalizado" ? colors : defaultColors;

  return (
    <div className={styles.wrap}>
      <div className={styles.controlsRow}>
        <div>
          <h3 className={styles.title}>Vista previa en tiempo real</h3>
          <p className={styles.subtitle}>Así verán los usuarios tu plataforma.</p>
        </div>
        <div className={styles.deviceToggle}>
          <button type="button" data-active={device === "desktop"} onClick={() => setDevice("desktop")}>
            <DesktopIcon className={styles.toggleIcon} />
            Desktop
          </button>
          <button type="button" data-active={device === "mobile"} onClick={() => setDevice("mobile")}>
            <MobileIcon className={styles.toggleIcon} />
            Móvil
          </button>
        </div>
      </div>

      <div className={styles.versionRow}>
        <div className={styles.versionSwitch}>
          <button type="button" data-active={version === "original"} onClick={() => setVersion("original")}>
            Original
          </button>
          <button type="button" data-active={version === "personalizado"} onClick={() => setVersion("personalizado")}>
            Personalizado
          </button>
        </div>
      </div>

      <div className={styles.browserFrame} data-device={device}>
        <div className={styles.miniHeader}>
          <span className={styles.miniLogo} style={{ color: active.textPrimary }}>
            passo
          </span>
          {device === "desktop" && (
            <nav className={styles.miniNav}>
              <span>Eventos</span>
              <span>Ciudades</span>
              <span>Categorías</span>
              <span>Ayuda</span>
            </nav>
          )}
          <div className={styles.miniActions}>
            <SearchIcon className={styles.miniSearchIcon} />
            {device === "desktop" && <span className={styles.miniLoginText}>Iniciar sesión</span>}
            <span className={styles.miniCta} style={{ background: active.secondary }}>
              +
            </span>
          </div>
        </div>

        <div
          className={styles.miniHero}
          style={{
            background: `linear-gradient(135deg, ${active.bgDark} 0%, ${active.primary} 100%)`,
          }}
        >
          <span className={styles.miniWatermark}>La vida se vive aquí.</span>
          <h4 className={styles.miniHeroTitle}>
            Vive eventos
            <br />
            extraordinarios
          </h4>
          <p className={styles.miniHeroSubtitle}>Entradas digitales, seguras y al instante.</p>
          <span className={styles.miniHeroCta} style={{ background: active.secondary }}>
            Ver eventos
          </span>
        </div>

        <div className={styles.miniBody}>
          <div className={styles.miniCardsRow}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.miniCard}>
                <div className={styles.miniCardImage} />
                <div className={styles.miniCardBar} style={{ background: active.textSecondary, opacity: 0.4 }} />
                <div className={styles.miniCardBarShort} style={{ background: active.textSecondary, opacity: 0.25 }} />
              </div>
            ))}
          </div>
          <div className={styles.miniStatusRow}>
            <span className={styles.miniStatusPill} style={{ background: active.success }}>
              Éxito
            </span>
            <span className={styles.miniStatusPill} style={{ background: active.warning }}>
              Aviso
            </span>
            <span className={styles.miniStatusPill} style={{ background: active.error }}>
              Error
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
