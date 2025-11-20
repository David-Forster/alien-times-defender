import { initialTable, GAME_LENGTH, EARLY_SESSION_THRESHOLD, MIN_RATING, MAX_RATING, TIMEOUT_TIME } from '../constants';
import { getPlayerDataKey, initializePlayerData } from '../utils/player';

export type PuzzleEntry = { puzzle: string; rating: number; userRating: number };

export class PuzzleManager {
  competencyTable: PuzzleEntry[];
  playCount: number;
  puzzles: PuzzleEntry[];
  currentIndex: number;
  deltas: number[];
  times: number[];
  correctness: boolean[];
  answerHistory: { puzzle: string; time: number; correct: boolean }[];

  constructor() {
    this.competencyTable = [];
    this.playCount = 0;
    this.puzzles = [];
    this.currentIndex = 0;
    this.deltas = [];
    this.times = [];
    this.correctness = [];
    this.answerHistory = [];
  }

  loadData() {
    const tableKey = getPlayerDataKey('competencyTable');
    const historyKey = getPlayerDataKey('answerHistory');
    const playCountKey = getPlayerDataKey('playCount');

    this.competencyTable = JSON.parse(localStorage.getItem(tableKey) || JSON.stringify(initialTable));
    this.answerHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    this.playCount = parseInt(localStorage.getItem(playCountKey) || '0');
    this.playCount++;
    localStorage.setItem(playCountKey, this.playCount.toString());

    this.puzzles = [];

    if (this.playCount <= EARLY_SESSION_THRESHOLD) {
      this.puzzles = this.shuffle([...this.competencyTable]).slice(0, GAME_LENGTH);
    } else {
      this.puzzles = this.selectPuzzlesAdaptive(this.competencyTable, GAME_LENGTH);
    }

    this.deltas = [];
    this.times = [];
    this.correctness = [];
    this.currentIndex = 0;

    return true;
  }

  private pulloutRandomItem(candidates: PuzzleEntry[]) {
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates.splice(idx, 1)[0];
  }

  private selectPuzzlesAdaptive(competencyTable: PuzzleEntry[], gameLength: number): PuzzleEntry[] {
    const candidates = [...competencyTable];
    const selected: PuzzleEntry[] = [];

    const nearMastery = candidates
      .filter(p => p.userRating >= 6 && p.userRating <= 15)
      .sort((a, b) => a.userRating - b.userRating);

    const weak = candidates
      .filter(p => p.userRating > 30)
      .sort((a, b) => b.userRating - a.userRating);

    while (selected.length < gameLength) {
      if (selected.length < gameLength * 0.7 && nearMastery.length > 0) {
        selected.push(this.pulloutRandomItem(nearMastery));
        continue;
      }

      if (selected.length < gameLength * 0.9 && weak.length > 0) {
        selected.push(this.pulloutRandomItem(weak));
        continue;
      }

      const remaining = candidates.filter(c => !selected.includes(c));
      if (remaining.length === 0) {
        break;
      }

      const idx = Math.floor(Math.random() * remaining.length);
      selected.push(this.pulloutRandomItem(remaining));
    }

    return selected;
  }

  getCorrectDelta(timeTaken: number): number {
    if (timeTaken <= 2.0) return -8;
    if (timeTaken <= 3.0) return -6;
    if (timeTaken <= 5.0) return -4;
    if (timeTaken <= 10.0) return -2;
    return -1;
  }

  getIncorrectDelta(currentRating: number): number {
    return currentRating <= 20 ? 8 : 12;
  }

  updateRating(puzzle: string, isCorrect: boolean, timeTaken: number) {
    const entry = this.competencyTable.find(e => e.puzzle === puzzle)!;
    const oldRating = entry.userRating;
    const delta = isCorrect ? this.getCorrectDelta(timeTaken) : this.getIncorrectDelta(entry.userRating);
    entry.userRating = Math.min(MAX_RATING, Math.max(MIN_RATING, entry.userRating + delta));
    this.deltas.push(entry.userRating - oldRating);
    return delta;
  }

  recordAnswer(puzzle: string, time: number, correct: boolean) {
    this.times.push(time);
    this.correctness.push(correct);
    this.answerHistory.push({ puzzle, time, correct });
    if (this.answerHistory.length > 50) this.answerHistory.shift();
    localStorage.setItem(getPlayerDataKey('answerHistory'), JSON.stringify(this.answerHistory));
    localStorage.setItem(getPlayerDataKey('competencyTable'), JSON.stringify(this.competencyTable));
  }

  getCurrentPuzzle(): PuzzleEntry {
    return this.puzzles[this.currentIndex];
  }

  nextPuzzle(): boolean {
    this.currentIndex++;
    return this.currentIndex < this.puzzles.length;
  }

  getProgress(): { current: number; total: number } {
    return { current: this.currentIndex + 1, total: GAME_LENGTH };
  }

  private shuffle(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
