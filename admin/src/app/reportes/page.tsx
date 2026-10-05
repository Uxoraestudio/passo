import { redirect } from "next/navigation";

// Reportes ahora vive dentro de Ventas y reportes; la ruta se mantiene para enlaces antiguos.
export default function ReportesPage() {
  redirect("/ventas/");
}
