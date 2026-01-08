// lib/leadLinks.ts
export function normalizePhone(raw: string) {
  if (!raw) return "";
  const trimmed = raw.trim();
  // keep + and digits only
  const cleaned = trimmed.replace(/[^\d+]/g, "");
  // if number starts with 00 => convert to +
  if (cleaned.startsWith("00")) return "+" + cleaned.slice(2);
  // if starts with 0 and looks like PK local => you can adjust later
  return cleaned;
}

export function waLink(phoneRaw: string, message: string) {
  const phone = normalizePhone(phoneRaw).replace(/^\+/, "");
  const text = encodeURIComponent(message || "");
  // wa.me requires number without +
  return `https://wa.me/${phone}?text=${text}`;
}

export function telLink(phoneRaw: string) {
  const phone = normalizePhone(phoneRaw);
  return `tel:${phone}`;
}

export function daysOverdueISO(iso: string) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - d;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
