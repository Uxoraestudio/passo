import { notFound } from "next/navigation";
import PerfHarness from "@/components/venue-editor/PerfHarness";

// Development-only bench: the plan editor and the event seat canvas with
// 20,000 synthetic seats, to measure pan and zoom (Fase 6). Not in production.
export default function RendimientoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PerfHarness />;
}
