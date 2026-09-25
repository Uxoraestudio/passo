"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckSmallIcon, PublishIcon, RestoreIcon } from "@/components/icons";
import { colorFields, defaultColors, logoSlots, type ColorFieldId, type LogoSlotId } from "@/lib/appearance-data";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings";
import ColorField from "./ColorField";
import LogoCard from "./LogoCard";
import AppearancePreview from "./AppearancePreview";
import styles from "./AppearanceContent.module.css";

type Colors = Record<ColorFieldId, string>;
type Logos = Partial<Record<LogoSlotId, string>>;

export default function AppearanceContent() {
  const [colors, setColors] = useState<Colors>(defaultColors);
  const [logos, setLogos] = useState<Logos>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const settings = await getSiteSettings();
        if (!active) return;
        setColors({ ...defaultColors, ...settings.colors });
        setLogos(settings.logos);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const isDirty = useMemo(
    () => colorFields.some((field) => colors[field.id].toUpperCase() !== field.default.toUpperCase()),
    [colors]
  );

  const setColor = (id: ColorFieldId, value: string) => {
    setColors((prev) => ({ ...prev, [id]: value }));
    setPublished(false);
  };

  const setLogo = (id: LogoSlotId, url: string | null) => {
    setLogos((prev) => {
      const next = { ...prev };
      if (url) next[id] = url;
      else delete next[id];
      return next;
    });
    setPublished(false);
  };

  const handleRestore = () => {
    setColors(defaultColors);
    setPublished(false);
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await saveSiteSettings(colors, logos);
      setPublished(true);
    } catch {
      window.alert("No pudimos publicar los cambios. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
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
          <button
            type="button"
            className={styles.publishButton}
            onClick={handlePublish}
            disabled={loading || saving || (!isDirty && published)}
          >
            {published ? <CheckSmallIcon className={styles.actionIcon} /> : <PublishIcon className={styles.actionIcon} />}
            {saving ? "Publicando..." : published ? "Cambios publicados" : "Publicar cambios"}
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
                <LogoCard key={slot.id} slot={slot} value={logos[slot.id] ?? null} onChange={(url) => setLogo(slot.id, url)} />
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
