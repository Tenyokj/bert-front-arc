export const WINTER_THEME = {
  enabled: true,
  startsAt: Date.parse("2026-11-27T00:00:00Z"),
  endsAt: Date.parse("2027-01-11T00:00:00Z"),
  preferenceKey: "bert:winter-effects:2026",
} as const;

export function winterSeasonActive(timestamp: number) {
  return WINTER_THEME.enabled && timestamp >= WINTER_THEME.startsAt && timestamp < WINTER_THEME.endsAt;
}

// Deterministic decoration keeps SSR/hydration stable and needs no animation loop.
export const SNOWFLAKES = Array.from({ length: 12 }, (_, index) => ({
  lane: 8 + (index * 29) % 76,
  size: 3 + index % 4,
  duration: 14 + (index * 7) % 15,
  delay: -(index * 5.7),
  drift: -8 + (index * 7) % 17,
}));
