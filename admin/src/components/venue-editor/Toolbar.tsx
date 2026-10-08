"use client";

import { MaterialIcon } from "@/components/icons";
import type { Tool } from "./editorTypes";
import styles from "./VenueEditor.module.css";

type ToolDef = { tool: Tool; icon: string; label: string; key?: string; edit?: boolean };

const groups: ToolDef[][] = [
  [
    { tool: "select", icon: "arrow_selector_tool", label: "Seleccionar y mover", key: "V" },
    { tool: "pan", icon: "pan_tool", label: "Mover la vista (o mantén Espacio)", key: "H" },
  ],
  [
    { tool: "section", icon: "pentagon", label: "Dibujar sector", key: "P", edit: true },
    { tool: "calibrate", icon: "straighten", label: "Calibrar escala", key: "C", edit: true },
  ],
  [
    { tool: "element:STAGE", icon: "theater_comedy", label: "Escenario", edit: true },
    { tool: "element:ENTRANCE", icon: "login", label: "Entrada", edit: true },
    { tool: "element:EXIT", icon: "logout", label: "Salida", edit: true },
    { tool: "element:BAR", icon: "local_bar", label: "Bar", edit: true },
    { tool: "element:BATHROOM", icon: "wc", label: "Baños", edit: true },
    { tool: "element:TEXT", icon: "title", label: "Texto", edit: true },
  ],
];

export const TOOL_SHORTCUTS: Record<string, Tool> = { v: "select", h: "pan", p: "section", c: "calibrate" };

export default function Toolbar({ tool, readOnly, onTool }: { tool: Tool; readOnly: boolean; onTool: (tool: Tool) => void }) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Herramientas del plano" aria-orientation="vertical">
      {groups.map((group, i) => (
        <div key={i} className={styles.toolGroup}>
          {group.map((t) => {
            const disabled = readOnly && t.edit;
            const title = `${t.label}${t.key ? ` (${t.key})` : ""}`;
            return (
              <button
                key={t.tool}
                type="button"
                className={styles.toolButton}
                aria-pressed={tool === t.tool}
                aria-label={title}
                title={title}
                disabled={disabled}
                onClick={() => onTool(t.tool)}
              >
                <MaterialIcon decorative name={t.icon} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
