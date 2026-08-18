// Small formatting helpers shared by every page that displays money or
// dates. Keeping these in one place means "$1,234.50" and "3 days ago"
// are spelled the same way everywhere in the app instead of drifting.

/** "$1,234.56" — always 2 decimals, with the thousands separator. */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/** "$1.2K" / "$4.2M" — a compact form for tight spaces like stat tiles. */
export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "40 mins ago" for anything recent, falling back to a plain date once a
 * transaction is more than a week old — a relative time that old stops
 * being useful and just gets harder to read than the date itself.
 */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();

  if (diff < 0) return "just now"; // a future-dated transaction
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(diff / DAY);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "2026-08" — a sortable, groupable key for "which month is this in". */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** "2026-08" -> "August 2026" */
export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
