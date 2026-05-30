export interface Level {
  min: number;
  max: number;
  name: string;
  avatar: string;
  label: string;
}

export const LEVELS: Level[] = [
  { min: 0,   max: 3,   name: '🌱 はじめての一歩', avatar: '🌱', label: '🌱 はじめて' },
  { min: 4,   max: 7,   name: '⭐ がんばり屋',      avatar: '⭐', label: '⭐ がんばり屋' },
  { min: 8,   max: 14,  name: '🔥 すごい！',        avatar: '🔥', label: '🔥 すごい！' },
  { min: 15,  max: 999, name: '👑 タスクマスター',  avatar: '👑', label: '👑 マスター' },
];

export function getLevel(stars: number): Level {
  return LEVELS.find(l => stars >= l.min && stars <= l.max) ?? LEVELS[0];
}

export function getNextLevel(stars: number): Level | null {
  const cur = getLevel(stars);
  return LEVELS.find(l => l.min > cur.max) ?? null;
}

export function getLevelProgress(stars: number): number {
  const cur = getLevel(stars);
  const next = getNextLevel(stars);
  if (!next) return 100;
  return Math.round(((stars - cur.min) / (next.min - cur.min)) * 100);
}
