"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckSmallIcon, MaterialIcon, PublishIcon } from "@/components/icons";
import { listSeoPages, saveSeoPage, uploadSeoImage, type SeoPage } from "@/lib/seo-data";
import styles from "./SeoContent.module.css";

function SeoPageCard({
  page,
  onChange,
}: {
  page: SeoPage;
  onChange: (page: SeoPage) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof SeoPage>(key: K, value: SeoPage[K]) => {
    onChange({ ...page, [key]: value });
  };

  const handleFile = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadSeoImage(page.pageKey, file);
      update("ogImageUrl", url);
    } catch {
      window.alert("No pudimos subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{page.label}</h3>
        <p className={styles.cardSubtitle}>{page.description}</p>
      </div>

      <div className={styles.fieldGrid}>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Meta title</span>
          <input type="text" value={page.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} placeholder="Título para buscadores" />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Meta description</span>
          <textarea rows={2} value={page.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} placeholder="Descripción para buscadores" />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Open Graph — título</span>
          <input type="text" value={page.ogTitle} onChange={(e) => update("ogTitle", e.target.value)} placeholder="Título al compartir" />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Open Graph — descripción</span>
          <input type="text" value={page.ogDescription} onChange={(e) => update("ogDescription", e.target.value)} placeholder="Descripción al compartir" />
        </label>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Open Graph — imagen</span>
          <div className={styles.imageUpload}>
            <div className={styles.imagePreview}>
              {page.ogImageUrl ? (
                <Image src={page.ogImageUrl} alt={`Vista previa OG de ${page.label}`} fill sizes="88px" className={styles.imagePreviewImage} unoptimized />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <MaterialIcon name="image" />
                </div>
              )}
            </div>
            <div className={styles.imageActions}>
              <button type="button" className={styles.uploadButton} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? "Subiendo..." : page.ogImageUrl ? "Cambiar imagen" : "Subir imagen"}
              </button>
              {page.ogImageUrl && (
                <button type="button" className={styles.removeImageButton} onClick={() => update("ogImageUrl", null)} disabled={uploading}>
                  Quitar imagen
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeoContent() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await listSeoPages();
        if (active) setPages(data);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const updatePage = (next: SeoPage) => {
    setPages((prev) => prev.map((p) => (p.pageKey === next.pageKey ? next : p)));
    setPublished(false);
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await Promise.all(pages.map((page) => saveSeoPage(page)));
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
          <h1 className={styles.title}>SEO del sitio</h1>
          <p className={styles.subtitle}>Administra title, meta description y Open Graph de las páginas principales.</p>
        </div>
        <button type="button" className={styles.publishButton} onClick={handlePublish} disabled={loading || saving}>
          {published ? <CheckSmallIcon className={styles.actionIcon} /> : <PublishIcon className={styles.actionIcon} />}
          {saving ? "Publicando..." : published ? "Cambios publicados" : "Publicar cambios"}
        </button>
      </div>

      <div className={styles.list}>
        {pages.map((page) => (
          <SeoPageCard key={page.pageKey} page={page} onChange={updatePage} />
        ))}
      </div>
    </div>
  );
}
