import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  const clean = path.replace(/\\/g, "/");
  if (clean.startsWith("http")) return clean;
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}/${clean.replace(/^\//, "")}`;
}

export function getImageAccent(url: string): Promise<[number, number, number] | null> {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 24;
        const c = document.createElement("canvas");
        c.width = size; c.height = size;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size, size);
        const d = ctx.getImageData(0, 0, size, size).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const rr = d[i], gg = d[i + 1], bb = d[i + 2];
          const sat = Math.max(rr, gg, bb) - Math.min(rr, gg, bb);
          if (sat < 25) continue;
          r += rr; g += gg; b += bb; n++;
        }
        if (n < 5) {
          r = g = b = 0; n = 0;
          for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        }
        if (!n) { resolve(null); return; }
        resolve([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function buildWaveGradient(rgb: [number, number, number]): string[] {
  const [r, g, b] = rgb;
  const lighten = (f: number) =>
    `rgb(${Math.min(255, Math.round(r + (255 - r) * f))},${Math.min(255, Math.round(g + (255 - g) * f))},${Math.min(255, Math.round(b + (255 - b) * f))})`;
  const darken = (f: number) =>
    `rgb(${Math.round(r * (1 - f))},${Math.round(g * (1 - f))},${Math.round(b * (1 - f))})`;
  return [lighten(0.5), `rgb(${r},${g},${b})`, darken(0.3)];
}

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

export function formatNumber(n?: number): string {
  return (n ?? 0).toLocaleString("en-US");
}

export function formatBytes(bytes?: number): string {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} Б`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} КБ`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} МБ`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} ГБ`;
}

export function formatTime(s?: number): string {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
