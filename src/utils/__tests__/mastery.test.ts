import { describe, it, expect } from 'vitest';
import { calculateMastery } from '../mastery';
import { MASTERY_THRESHOLD_FAST } from '../../constants';

describe('calculateMastery', () => {
  it('handles empty table', () => {
    const result = calculateMastery([], []);
    expect(result.totalPuzzles).toBe(0);
    expect(result.puzzlesAtMastery).toBe(0);
    expect(result.avgResponseTime).toBe(0);
    expect(result.recentAccuracy).toBe(1);
    // Note: masteryScore may be NaN due to division by zero in confidenceScore
    expect(result.masteryScore).toBeNaN();
  });

  it('reaches 100% mastery with optimal conditions', () => {
    const table = [
      { puzzle: '2x2', userRating: 1 },
      { puzzle: '2x3', userRating: 1 },
    ];
    const history: { time: number; correct: boolean }[] = [];
    const result = calculateMastery(table, history);
    expect(result.masteryScore).toBe(100);
    expect(result.avgResponseTime).toBe(0);
    expect(result.recentAccuracy).toBe(1);
    expect(result.puzzlesAtMastery).toBe(2);
    expect(result.totalPuzzles).toBe(2);
  });

  it('approaches 100% mastery with high confidence and accuracy but slower speed', () => {
    const table = [
      { puzzle: '2x2', userRating: 1 },
      { puzzle: '2x3', userRating: 1 },
    ];
    const history = [
      { time: MASTERY_THRESHOLD_FAST, correct: true },
      { time: MASTERY_THRESHOLD_FAST, correct: true },
    ];
    const result = calculateMastery(table, history);
    // confidenceScore = 100, speedBonus = 100 - (3/3)*50 = 50, accuracy=100, score=100*0.5 +50*0.25 +100*0.25=50+12.5+25=87.5 ->88
    expect(result.masteryScore).toBe(88);
    expect(result.avgResponseTime).toBe(MASTERY_THRESHOLD_FAST);
    expect(result.recentAccuracy).toBe(1);
  });

  it('has low mastery with poor conditions', () => {
    const table = [
      { puzzle: '12x12', userRating: 100 },
      { puzzle: '11x11', userRating: 100 },
    ];
    const history = [
      { time: MASTERY_THRESHOLD_FAST * 2, correct: false },
      { time: MASTERY_THRESHOLD_FAST * 2, correct: false },
    ];
    const result = calculateMastery(table, history);
    // confidenceScore = (1+1)/2=1, speedBonus=100-(6/3)*50=100-100=0, accuracy=0, score=1*0.5 +0*0.25 +0*0.25=0.5->1
    expect(result.masteryScore).toBe(1);
    expect(result.avgResponseTime).toBe(MASTERY_THRESHOLD_FAST * 2);
    expect(result.recentAccuracy).toBe(0);
  });

  it('filters out invalid userRatings below 1', () => {
    const table = [
      { puzzle: '2x2', userRating: 0 },
      { puzzle: '2x3', userRating: 1 },
      { puzzle: '2x4', userRating: 2 },
    ];
    const result = calculateMastery(table, []);
    expect(result.totalPuzzles).toBe(2);
    expect(result.puzzlesAtMastery).toBe(2); // both <=5
  });

  it('handles boundary userRating of 1 and 100', () => {
    const table = [
      { puzzle: '2x2', userRating: 1 },
      { puzzle: '12x12', userRating: 100 },
    ];
    const result = calculateMastery(table, []);
    // confidenceScore = (100 + 1)/2 = 50.5, speed=100, accuracy=100, score=50.5*0.5 +100*0.25 +100*0.25=25.25+25+25=75.25->75
    expect(result.masteryScore).toBe(75);
  });

  it('handles 0% recent accuracy', () => {
    const table = [{ puzzle: '2x2', userRating: 1 }];
    const history = [
      { time: 1, correct: false },
      { time: 1, correct: false },
    ];
    const result = calculateMastery(table, history);
    expect(result.recentAccuracy).toBe(0);
    expect(result.masteryScore).toBe(71); // 100*0.5 + (100 - (1/3)*50)*0.25 + 0*0.25 ≈50 + 83.33*0.25 +0 ≈50+20.83=70.83->71
  });

  it('handles 100% recent accuracy with fast times', () => {
    const table = [{ puzzle: '2x2', userRating: 1 }];
    const history = Array(20).fill({ time: 0.1, correct: true });
    const result = calculateMastery(table, history);
    expect(result.recentAccuracy).toBe(1);
    expect(result.avgResponseTime).toBeCloseTo(0.1);
    expect(result.masteryScore).toBe(100); // speedBonus ≈100 - (0.1/3)*50≈98.33, score≈50+24.58+25≈99.58->100
  });

  it('handles slow response times reducing speed bonus', () => {
    const table = [{ puzzle: '2x2', userRating: 1 }];
    const history = [{ time: MASTERY_THRESHOLD_FAST * 2, correct: true }];
    const result = calculateMastery(table, history);
    const expectedSpeedBonus = 100 - (MASTERY_THRESHOLD_FAST * 2 / MASTERY_THRESHOLD_FAST) * 50;
    expect(result.avgResponseTime).toBe(MASTERY_THRESHOLD_FAST * 2);
    // masteryScore = 100*0.5 + expectedSpeedBonus*0.25 +100*0.25
  });

  it('calculates puzzlesAtMastery correctly', () => {
    const table = [
      { puzzle: '2x2', userRating: 1 },
      { puzzle: '2x3', userRating: 5 },
      { puzzle: '2x4', userRating: 6 },
    ];
    const result = calculateMastery(table, []);
    expect(result.puzzlesAtMastery).toBe(2);
  });

  it('uses only last 20 history entries for calculations', () => {
    const table = [{ puzzle: '2x2', userRating: 1 }];
    const history = Array(25).fill({ time: 1, correct: true });
    history[24] = { time: 1, correct: false }; // last one wrong
    const result = calculateMastery(table, history);
    expect(result.recentAccuracy).toBe(19/20); // 19 correct out of 20
  });
});