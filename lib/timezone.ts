export const DEFAULT_BUSINESS_TIMEZONE = "America/New_York";

function getZonedCalendarParts(utcMs: number, timeZone: string) {
  const d = new Date(utcMs);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = dtf.formatToParts(d);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type === "year" || p.type === "month" || p.type === "day" || p.type === "hour" || p.type === "minute") {
      map[p.type] = Number(p.value);
    }
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Current instant as a Date. (JS Date is always UTC internally; format with {@link formatInBusinessTimezone} for business-local display.)
 */
export function nowInBusinessTimezone(_timezone: string): Date {
  void _timezone;
  return new Date();
}

export function formatInBusinessTimezone(
  utcDate: string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcDate);
  if (Number.isNaN(date.getTime())) return utcDate;

  const resolvedTimezone = timezone || DEFAULT_BUSINESS_TIMEZONE;
  const formatterOptions: Intl.DateTimeFormatOptions = options ?? {
    dateStyle: "medium",
    timeStyle: "short",
  };

  try {
    return new Intl.DateTimeFormat("en-US", {
      ...formatterOptions,
      timeZone: resolvedTimezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      ...formatterOptions,
      timeZone: DEFAULT_BUSINESS_TIMEZONE,
    }).format(date);
  }
}

/** Compact timestamp for lists (messages sidebar, dashboard rows). */
export function formatShortInBusinessTimezone(utcDate: string, timezone: string): string {
  return formatInBusinessTimezone(utcDate, timezone, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Build `datetime-local` value (YYYY-MM-DDTHH:mm) for the given UTC instant, using wall time in `timeZone`.
 */
export function utcIsoToDatetimeLocalInputValue(utcIso: string, timezone: string): string {
  const ms = new Date(utcIso).getTime();
  if (Number.isNaN(ms)) return "";
  const tz = timezone || DEFAULT_BUSINESS_TIMEZONE;
  const p = getZonedCalendarParts(ms, tz);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
}

/**
 * Convert a UTC instant (ISO string or `Date`) to a `datetime-local` value (YYYY-MM-DDTHH:mm)
 * in the given IANA timezone (business wall time).
 */
export function toDatetimeLocalValue(utcIsoOrDate: string | Date, timezone: string): string {
  const iso =
    typeof utcIsoOrDate === "string" ? utcIsoOrDate : utcIsoOrDate.toISOString();
  return utcIsoToDatetimeLocalInputValue(iso, timezone);
}

/** Default "Starts" field: current instant, expressed as business-local wall time for `datetime-local`. */
export function nowAsDatetimeLocalInputForTimezone(timezone: string): string {
  return toDatetimeLocalValue(new Date(), timezone);
}

/**
 * Interpret a `datetime-local` string as wall time in `timeZone` and return the corresponding UTC Date.
 */
export function datetimeLocalWallTimeToUtc(value: string, timezone: string): Date | null {
  const trimmed = value.trim();
  const [datePart, timePart] = trimmed.split("T");
  if (!datePart || !timePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const tz = timezone || DEFAULT_BUSINESS_TIMEZONE;
  const target = { year: y, month: m, day: d, hour: hh, minute: mm };

  const center = Date.UTC(y, m - 1, d, 12, 0, 0);
  const stepMs = 60 * 1000;
  for (let i = -48 * 60; i <= 48 * 60; i++) {
    const ms = center + i * stepMs;
    const p = getZonedCalendarParts(ms, tz);
    if (
      p.year === target.year &&
      p.month === target.month &&
      p.day === target.day &&
      p.hour === target.hour &&
      p.minute === target.minute
    ) {
      return new Date(ms);
    }
  }
  return null;
}
