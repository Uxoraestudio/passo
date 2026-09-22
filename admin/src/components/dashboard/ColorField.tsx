"use client";

import { EyedropperIcon, ResetSmallIcon } from "@/components/icons";
import type { ColorField as ColorFieldType } from "@/lib/appearance-data";
import styles from "./ColorField.module.css";

type EyeDropperResult = { sRGBHex: string };
type EyeDropperCtor = new () => { open: () => Promise<EyeDropperResult> };

export default function ColorField({
  field,
  value,
  onChange,
}: {
  field: ColorFieldType;
  value: string;
  onChange: (value: string) => void;
}) {
  const isDirty = value.toUpperCase() !== field.default.toUpperCase();

  const handlePick = async () => {
    const EyeDropperApi = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
    if (!EyeDropperApi) return;
    try {
      const result = await new EyeDropperApi().open();
      onChange(result.sRGBHex.toUpperCase());
    } catch {
      // el usuario canceló la selección
    }
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>{field.label}</label>
      <div className={styles.row}>
        <span className={styles.swatch} style={{ background: value }} data-light={field.id === "bgLight"} />
        <div className={styles.inputWrap}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            spellCheck={false}
            maxLength={7}
          />
        </div>
        <button type="button" className={styles.iconButton} onClick={handlePick} aria-label={`Seleccionar ${field.label} con gotero`}>
          <EyedropperIcon className={styles.icon} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onChange(field.default)}
          disabled={!isDirty}
          aria-label={`Restablecer ${field.label}`}
        >
          <ResetSmallIcon className={styles.icon} />
        </button>
      </div>
    </div>
  );
}
