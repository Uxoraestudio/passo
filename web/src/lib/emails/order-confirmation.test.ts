import { describe, expect, it } from "vitest";
import { eventDateText, orderConfirmationEmail } from "./order-confirmation";

const base = {
  buyerName: "Camila Rojas",
  orderCode: "PS-95B3307B5B",
  orderUrl: "https://aforiq.cl/compra/abc/",
  printUrl: "https://aforiq.cl/compra/abc/imprimir/",
  event: { title: "Gran Parrandón Navideño", date: "2026-12-12T00:00:00Z", venue: "Club D", city: "Viña del Mar" },
  tickets: [{ shortCode: "PS-95B3307B5B-01", holder: "Camila Rojas", sector: "General", seat: "Acceso general" }],
  subtotal: 15000,
  serviceFee: 1500,
  total: 16500,
};

describe("order confirmation e-mail", () => {
  it("writes the event date in Chilean time", () => {
    // 00:00 UTC on Dec 12 is 21:00 on Friday Dec 11 in Santiago (summer time).
    expect(eventDateText("2026-12-12T00:00:00Z")).toBe("viernes, 11 de diciembre de 2026, 21:00 hrs");
  });

  it("greets by first name and lists the tickets with totals", () => {
    const mail = orderConfirmationEmail(base);
    expect(mail.subject).toBe("Tus entradas para Gran Parrandón Navideño · PS-95B3307B5B");
    expect(mail.text).toContain("Hola Camila, recibimos tu pago y tu entrada ya está lista.");
    expect(mail.text).toContain("Camila Rojas · General · Acceso general (PS-95B3307B5B-01)");
    expect(mail.html).toContain("$16.500");
    expect(mail.html).toContain("https://aforiq.cl/compra/abc/imprimir/");
  });

  it("uses the plural for several tickets", () => {
    const mail = orderConfirmationEmail({ ...base, tickets: [...base.tickets, { ...base.tickets[0], shortCode: "PS-95B3307B5B-02" }] });
    expect(mail.text).toContain("tus 2 entradas ya están listas");
  });

  it("escapes names so they can't inject HTML", () => {
    const mail = orderConfirmationEmail({ ...base, tickets: [{ ...base.tickets[0], holder: "<script>x</script>" }] });
    expect(mail.html).not.toContain("<script>x");
    expect(mail.html).toContain("&lt;script&gt;x");
  });
});
