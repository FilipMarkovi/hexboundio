import { GAMER_NAMES } from "./constants";

export function getRandomNames(count: number): string[] {
  // 1. Create a shallow copy
  const shuffled = [...GAMER_NAMES];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}