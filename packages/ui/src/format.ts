const MADRID_TZ = "Europe/Madrid";

export function format24h(timeIso: string): string {
  const d = new Date(timeIso);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatDateUI(dateIso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateIso));
}

export function formatDateLongCA(dateIso: string): string {
  return new Intl.DateTimeFormat("ca-ES", {
    timeZone: MADRID_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateIso));
}

export function formatDateLongES(dateIso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateIso));
}

export function formatDateLongEN(dateIso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateIso));
}

export function formatMoney(
  amount: number,
  currency: string,
  locale: "en" | "ca" | "es" = "en",
): string {
  const localeMap = { en: "en-GB", ca: "ca-ES", es: "es-ES" } as const;
  return new Intl.NumberFormat(localeMap[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function formatLocalPhone(e164: string): string {
  if (e164.startsWith("+34") && e164.length === 12) {
    const rest = e164.slice(3);
    return `${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }
  return e164;
}
