import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolve a stored file path (cover / banner / audio) to a usable URL. */
export function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  const clean = path.replace(/\\/g, "/");
  if (clean.startsWith("http")) return clean;
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}/${clean.replace(/^\//, "")}`;
}

/** Compact number formatting: 1234 -> "1.2K", 4200000 -> "4.2M". */
export function formatCount(n?: number): string {
  const v = n ?? 0;
  if (v < 1000) return String(v);
  if (v < 1_000_000) {
    const k = v / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
  }
  const m = v / 1_000_000;
  return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
}

/** Full number with thousands separators: 142840 -> "142,840". */
export function formatNumber(n?: number): string {
  return (n ?? 0).toLocaleString("en-US");
}

/** Seconds -> "m:ss". */
export function formatTime(s?: number): string {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Total seconds across a list of durations -> "1h 32 min" / "48 min". */
export function formatTotalDuration(totalSeconds: number): string {
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m} min` : `${h}h`;
}

/** ISO date -> "Mar 14, 2024". */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "relative time ago" in Russian: "2 hours ago" style. */
export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const diff = Math.max(0, Date.now() - d);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} дн назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес назад`;
  return `${Math.floor(months / 12)} г назад`;
}

/**
 * Deterministic pseudo-stat for fields the backend does not store yet
 * (followers, monthly listeners, etc.) so the UI looks alive without random
 * numbers. Stable per seed.
 */
export function derivedStat(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9973.17) * 10000;
  const frac = x - Math.floor(x);
  return Math.floor(min + frac * (max - min));
}
