export interface TimeZoneCity {
  id: "sydney" | "india" | "london" | "newyork";
  label: string;
  city: string;
  zone: string;
  offsetHint: string;
}

export const WORLD_CLOCKS: TimeZoneCity[] = [
  {
    id: "sydney",
    label: "Sydney",
    city: "AEST / AEDT",
    zone: "Australia/Sydney",
    offsetHint: "AEST / AEDT",
  },
  {
    id: "india",
    label: "India",
    city: "IST",
    zone: "Asia/Kolkata",
    offsetHint: "IST · UTC +5:30",
  },
  {
    id: "london",
    label: "London",
    city: "GMT / BST",
    zone: "Europe/London",
    offsetHint: "GMT / BST",
  },
  {
    id: "newyork",
    label: "New York",
    city: "EST / EDT",
    zone: "America/New_York",
    offsetHint: "EST / EDT",
  },
];

export function formatInZone(date: Date, timeZone: string, withSeconds = true): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: true,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const hour = get("hour").padStart(2, "0");
  const minute = get("minute").padStart(2, "0");
  const period = get("dayPeriod").toUpperCase();

  if (!withSeconds) {
    return `${hour}:${minute} ${period}`;
  }

  return `${hour}:${minute}:${get("second").padStart(2, "0")} ${period}`;
}

export function formatDateInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function getZoneOffset(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function zonesShareOffsetYearRound(a: string, b: string): boolean {
  if (a === b) return true;
  const year = new Date().getUTCFullYear();
  const samples = [new Date(Date.UTC(year, 0, 15, 12)), new Date(Date.UTC(year, 6, 15, 12))];
  return samples.every((instant) => zoneOffsetMs(instant, a) === zoneOffsetMs(instant, b));
}

export function matchWorldClock(timeZone: string): TimeZoneCity | undefined {
  return WORLD_CLOCKS.find((city) => city.zone === timeZone || zonesShareOffsetYearRound(city.zone, timeZone));
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const hour = value("hour") === 24 ? 0 : value("hour");
  const asUtc = Date.UTC(value("year"), value("month") - 1, value("day"), hour, value("minute"), value("second"));
  return asUtc - instant.getTime();
}

export function convertWallTime(sourceIsoLocal: string, sourceZone: string): Date {
  const [datePart, timePart] = sourceIsoLocal.split("T");
  if (!datePart || !timePart) {
    return new Date();
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const utcGuess = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0);
  const firstPass = new Date(utcGuess - zoneOffsetMs(new Date(utcGuess), sourceZone));
  return new Date(utcGuess - zoneOffsetMs(firstPass, sourceZone));
}
