import { MASTERY_THRESHOLD_FAST, MASTERY_THRESHOLD_ACCURACY } from '../constants';

export interface MasteryStats {
  masteryScore: number;
  avgResponseTime: number;
  recentAccuracy: number;
  puzzlesAtMastery: number;
  totalPuzzles: number;
}

export function calculateMastery(
  table: Array<{ puzzle: string; userRating: number }>,
  history: { time: number; correct: boolean }[] = []
): MasteryStats {
  const validEntries = table.filter(p => p.userRating >= 1);
  const totalPuzzles = validEntries.length;

  // 1. Skill Confidence: lower userRating = more confident → map 1..100 → 100..0
  const confidenceScore = validEntries.reduce((sum, p) => sum + (101 - p.userRating), 0) / totalPuzzles;

  // 2. Speed & Accuracy from recent history (last 20 answers)
  const recent = history.slice(-20);
  const recentAccuracy = recent.length > 0 ? recent.filter(h => h.correct).length / recent.length : 0;
  const avgResponseTime = recent.length > 0 ? recent.reduce((s, h) => s + h.time, 0) / recent.length : 0;

  // 3. Mastery count: puzzles with userRating <= 5 AND fast in history
  const puzzlesAtMastery = validEntries.filter(p => p.userRating <= 5).length;

  // 4. Final Mastery Score (0–100)
  const speedBonus = avgResponseTime > 0 ? Math.max(0, 100 - (avgResponseTime / MASTERY_THRESHOLD_FAST) * 50) : 0;
  const accuracyBonus = recentAccuracy * 100;
  const masteryScore = Math.round(
    (confidenceScore * 0.5) +
    (speedBonus * 0.25) +
    (accuracyBonus * 0.25)
  );

  return {
    masteryScore: Math.min(100, Math.max(0, masteryScore)),
    avgResponseTime,
    recentAccuracy,
    puzzlesAtMastery,
    totalPuzzles
  };
}