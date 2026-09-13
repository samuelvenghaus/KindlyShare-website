import type { Platform, Sentiment } from "./types";

export const PLATFORM_LABELS: Record<Platform, string> = {
  google: "Google Reviews",
  trustpilot: "Trustpilot",
  app_store: "App Store",
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  overig: "Overig",
};

export const PLATFORM_SHORT_LABELS: Record<Platform, string> = {
  google: "Google",
  trustpilot: "Trustpilot",
  app_store: "App Store",
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  overig: "Overig",
};

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: "Positief",
  neutral: "Neutraal",
  negative: "Negatief",
};

export function formatTimeAgo(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo} min geleden`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "uur" : "uur"} geleden`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "dag" : "dagen"} geleden`;
}

/** Minuten sinds `date`, tov het moment van aanroepen. */
export function minutesSince(date: Date): number {
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
}
