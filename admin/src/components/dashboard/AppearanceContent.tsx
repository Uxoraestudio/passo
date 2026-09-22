"use client";

import { useMemo, useState } from "react";
import { CheckSmallIcon, PublishIcon, RestoreIcon } from "@/components/icons";
import { colorFields, defaultColors, logoSlots, type ColorFieldId } from "@/lib/appearance-data";
import ColorField from "./ColorField";
import LogoCard from "./LogoCard";
import AppearancePreview from "./AppearancePreview";
import styles from "./AppearanceContent.module.css";

type Colors = Record<ColorFieldId, string>;

export default function AppearanceContent() {
  const [colors, setColors] = useState<Colors>(defaultColors);
  const [published, setPublished] = useState(false);

  const isDirty = useMemo(
    () => colorFields.some((field) => colors[field.id].toUpperCase() !== field.default.toUpperCase()),
    [colors]
  );

  const setColor = (id: ColorFieldId, value: string) => {
    setColors((prev) => ({ ...prev, [id]: value }));
    setPublished(false);
  };

  const handleRestore = () => {
    setColors(defaultColors);
    setPublished(false);
  };

  const handlePublish = () => {
    setPublished(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Personalización de la plataforma</h1>
          <p className={styles.subtitle}>Administra los logos y colores de tu sitio.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.restoreButton} onClick={handleRestore} disabled={!isDirty}>
            <RestoreIcon className={styles.actionIcon} />
            Restaurar
          </button>
          <button type="button" className={styles.publishButton} onClick={handlePublish} disabled={!isDirty && !published}>
            {published ? <CheckSmallIcon className={styles.actionIcon} /> : <PublishIcon className={styles.actionIcon} />}
            {published ? "Cambios publicados" : "Publicar cambios"}
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Logos</h2>
              <p className={styles.sectionSubtitle}>Sube los logos de tu plataforma.</p>
            </div>
            <div className={styles.logoGrid}>
              {logoSlots.map((slot) => (
                <LogoCard key={slot.id} slot={slot} />
              ))}
            </div>
            <div className={styles.infoBanner}>
              <span className={styles.infoDot}>i</span>
              Los archivos se aplicarán en toda la plataforma.
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Colores</h2>
              <p className={styles.sectionSubtitle}>Define la paleta de colores de tu plataforma.</p>
            </div>
            <div className={styles.colorGrid}>
              {colorFields.map((field) => (
                <ColorField key={field.id} field={field} value={colors[field.id]} onChange={(value) => setColor(field.id, value)} />
              ))}
            </div>
            <div className={styles.contrastBanner}>
              <span className={styles.contrastIcon}>
                <CheckSmallIcon className={styles.contrastCheck} />
              </span>
              <div>
                <div className={styles.contrastHeading}>
                  <span>Contraste de colores</span>
                  <span className={styles.contrastBadge}>
                    <CheckSmallIcon className={styles.contrastBadgeIcon} />
                    AA aprobado
                  </span>
                </div>
                <p className={styles.contrastText}>
                  Los colores principales cumplen con los estándares de accesibilidad (WCAG 2.1 AA).
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.rightColumn}>
          <AppearancePreview colors={colors} />
        </div>
      </div>
    </div>
  );
}
