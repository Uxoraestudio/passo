// Dates shown on the site are always in Chile's time, whatever time zone the
// server or the browser runs in (Vercel runs in UTC: an event at 21:00 on the
// 11th is 00:00 on the 12th there). Daylight saving time is handled by Intl.

const TIME_ZONE = "America/Santiago";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export type ChileDateParts = {
  year: number;
  /** 0–11, like Date#getMonth. */
  month: number;
  day: number;
  /** 0 (Sunday) – 6, like Date#getDay. */
  weekday: number;
  hour: number;
  minute: number;
};

export function chileParts(value: string | number | Date): ChileDateParts {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/** Today's date in Chile as YYYY-MM-DD (for date inputs). */
export function chileToday(now = Date.now()) {
  const p = chileParts(now);
  return `${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
