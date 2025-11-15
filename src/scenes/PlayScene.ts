import Phaser from 'phaser';
import { initialTable, GAME_LENGTH, EARLY_SESSION_THRESHOLD, TIMER_DELAY_MS, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR, PUZZLE_FONT_SIZE, INPUT_FONT_SIZE, FEEDBACK_FONT_SIZE, SCREEN_CENTER_X, PUZZLE_Y, INPUT_Y, TIMER_BAR_Y, FEEDBACK_Y, MIN_RATING, MAX_RATING, FEEDBACK_DELAY_MS, TIMEOUT_TIME } from '../constants';
import { getPlayerDataKey, initializePlayerData, getActivePlayer } from '../utils/player';

export default class PlayScene extends Phaser.Scene {
   competencyTable!: Array<{ puzzle: string; rating: number; userRating: number }>;
   playCount!: number;
   puzzles!: Array<{ puzzle: string; rating: number; userRating: number }>;
   currentIndex!: number;
   deltas!: number[];
   puzzleText!: Phaser.GameObjects.Text;
   inputText!: Phaser.GameObjects.Text;
   feedbackText!: Phaser.GameObjects.Text;
   timerBar!: Phaser.GameObjects.Rectangle;
   timerEvent!: Phaser.Time.TimerEvent;
   startTime!: number;
   answer!: string;
   times!: number[];
   correctness!: boolean[];
   answerHistory!: { puzzle: string; time: number; correct: boolean }[];

  constructor() {
    super('PlayScene');
  }

  create() {
    const player = getActivePlayer();
    if (!player) {
      this.scene.start('MenuScene');
      return;
    }

    const tableKey = getPlayerDataKey('competencyTable');
    const historyKey = getPlayerDataKey('answerHistory');
    const playCountKey = getPlayerDataKey('playCount');

    this.competencyTable = JSON.parse(localStorage.getItem(tableKey)!);
    this.answerHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    this.playCount = parseInt(localStorage.getItem(playCountKey) || '0');
    this.playCount++;
    localStorage.setItem(playCountKey, this.playCount.toString());

    this.puzzles = [];

    if (this.playCount <= EARLY_SESSION_THRESHOLD) {
      // Broad shuffle for early sessions
      this.puzzles = Phaser.Utils.Array.Shuffle([...this.competencyTable]).slice(0, GAME_LENGTH);
    } else {
      this.puzzles = this.selectPuzzlesAdaptive(this.competencyTable, GAME_LENGTH);
    }

    this.deltas = [];
    this.times = [];
    this.correctness = [];
    this.currentIndex = 0;
    this.presentPuzzle();
  }

  private selectPuzzlesAdaptive(competencyTable: Array<{ puzzle: string; rating: number; userRating: number }>, gameLength: number): Array<{ puzzle: string; rating: number; userRating: number }> {
    const candidates = [...competencyTable];
    const selected: typeof competencyTable = [];

    // Priority: puzzles with userRating 6–15 (almost mastered)
    const nearMastery = candidates
      .filter(p => p.userRating >= 6 && p.userRating <= 15)
      .sort((a, b) => a.userRating - b.userRating);

    const weak = candidates
      .filter(p => p.userRating > 30)
      .sort((a, b) => b.userRating - a.userRating);

    // Fill with: 60% near-mastery, 30% weak, 10% random
    while (selected.length < gameLength && (nearMastery.length > 0 || weak.length > 0)) {
      if (selected.length < gameLength * 0.6 && nearMastery.length > 0) {
        selected.push(nearMastery.shift()!);
      } else if (selected.length < gameLength * 0.9 && weak.length > 0) {
        selected.push(weak.shift()!);
      } else {
        const remaining = candidates.filter(c => !selected.includes(c));
        if (remaining.length > 0) {
          const idx = Math.floor(Math.random() * remaining.length);
          selected.push(...remaining.splice(idx, 1));
        }
      }
    }

    return selected;
  }

  presentPuzzle() {
    const puzzle = this.puzzles[this.currentIndex];
    this.puzzleText = this.add.text(SCREEN_CENTER_X, PUZZLE_Y, puzzle.puzzle + ' = ', { fontSize: PUZZLE_FONT_SIZE, color: '#ffffff' }).setOrigin(0.5);
    this.inputText = this.add.text(SCREEN_CENTER_X, INPUT_Y, '', { fontSize: INPUT_FONT_SIZE, color: '#ffffff' }).setOrigin(0.5);
    this.answer = '';
    this.startTime = Date.now();
    this.timerEvent = this.time.addEvent({ delay: TIMER_DELAY_MS, callback: this.onTimeout, callbackScope: this });
    this.timerBar = this.add.rectangle(SCREEN_CENTER_X, TIMER_BAR_Y, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR).setOrigin(0.5);
    this.tweens.add({
      targets: this.timerBar,
      scaleX: 0,
      duration: TIMER_DELAY_MS,
      ease: 'Linear',
    });
    this.input.keyboard.on('keydown', this.handleKey, this);
  }

  handleKey(event: KeyboardEvent) {
    if (event.key >= '0' && event.key <= '9') {
      this.answer += event.key;
      this.inputText.setText(this.answer);
    } else if (event.key === 'Backspace') {
      this.answer = this.answer.slice(0, -1);
      this.inputText.setText(this.answer);
    } else if (event.key === 'Enter') {
      this.submitAnswer();
    }
  }

  submitAnswer() {
    this.input.keyboard.off('keydown', this.handleKey, this);
    this.timerEvent.remove();
    this.tweens.killTweensOf(this.timerBar);
    const timeTaken = (Date.now() - this.startTime) / 1000;
    const [a, b] = this.puzzles[this.currentIndex].puzzle.split(' x ').map(Number);
    const correct = a * b;
    const userAnswer = parseInt(this.answer) || 0;
    const isCorrect = userAnswer === correct;
    this.times.push(timeTaken);
    this.correctness.push(isCorrect);
    const entry = this.competencyTable.find(e => e.puzzle === this.puzzles[this.currentIndex].puzzle)!;
    const oldRating = entry.userRating;

    // === NEW DYNAMIC LOSS FUNCTION ===
    let delta = 0;

    if (isCorrect) {
      // Fast → big confidence gain
      if (timeTaken <= 2.0) delta = -8;
      else if (timeTaken <= 3.0) delta = -6;
      else if (timeTaken <= 5.0) delta = -4;
      else if (timeTaken <= 10.0) delta = -2;
      else delta = -1; // slow correct → minimal gain
    } else {
      // Wrong → penalty scales with confidence (overconfidence hurts more)
      delta = entry.userRating <= 20 ? 8 : 12;
    }

    // Apply bounds
    entry.userRating = Math.min(MAX_RATING, Math.max(MIN_RATING, entry.userRating + delta));
    this.deltas.push(entry.userRating - oldRating);

    if (isCorrect) {
      this.feedbackText = this.add.text(SCREEN_CENTER_X, FEEDBACK_Y, `Correct! Time: ${timeTaken.toFixed(1)}s`, { fontSize: FEEDBACK_FONT_SIZE, color: '#00ff00' }).setOrigin(0.5);
    } else {
      this.feedbackText = this.add.text(SCREEN_CENTER_X, FEEDBACK_Y, `Incorrect. Answer was ${correct}`, { fontSize: FEEDBACK_FONT_SIZE, color: '#ff0000' }).setOrigin(0.5);
    }

    // Add floating delta
    const deltaText = this.add.text(
      SCREEN_CENTER_X + 100,
      INPUT_Y,
      `${delta > 0 ? '+' : ''}${delta}`,
      { fontSize: '32px', color: delta < 0 ? '#00ff00' : '#ff0000' }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: deltaText,
      y: INPUT_Y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => deltaText.destroy()
    });

    this.answerHistory.push({
      puzzle: this.puzzles[this.currentIndex].puzzle,
      time: timeTaken,
      correct: isCorrect
    });
    // Keep only last 50 answers
    if (this.answerHistory.length > 50) this.answerHistory.shift();
    localStorage.setItem(getPlayerDataKey('answerHistory'), JSON.stringify(this.answerHistory));

    localStorage.setItem(getPlayerDataKey('competencyTable'), JSON.stringify(this.competencyTable));
    this.time.delayedCall(FEEDBACK_DELAY_MS, this.nextPuzzle, [], this);
  }

  onTimeout() {
    this.input.keyboard.off('keydown', this.handleKey, this);
    const timeTaken = TIMEOUT_TIME;
    const isCorrect = false;
    const entry = this.competencyTable.find((e) => e.puzzle === this.puzzles[this.currentIndex].puzzle)!;
    const oldRating = entry.userRating;

    // === NEW DYNAMIC LOSS FUNCTION ===
    let delta = 0;
    // Wrong → penalty scales with confidence (overconfidence hurts more)
    delta = entry.userRating <= 20 ? 8 : 12;

    // Apply bounds
    entry.userRating = Math.min(MAX_RATING, Math.max(MIN_RATING, entry.userRating + delta));
    this.deltas.push(entry.userRating - oldRating);

    const [a, b] = this.puzzles[this.currentIndex].puzzle.split(' x ').map(Number);
    const correct = a * b;
    this.feedbackText = this.add.text(SCREEN_CENTER_X, INPUT_Y, `Timeout. Answer was ${correct}`, { fontSize: FEEDBACK_FONT_SIZE, color: '#ff0000' }).setOrigin(0.5);
    this.times.push(TIMEOUT_TIME);
    this.correctness.push(false);

    // Add floating delta
    const deltaText = this.add.text(
      SCREEN_CENTER_X + 100,
      INPUT_Y,
      `${delta > 0 ? '+' : ''}${delta}`,
      { fontSize: '32px', color: delta < 0 ? '#00ff00' : '#ff0000' }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: deltaText,
      y: INPUT_Y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => deltaText.destroy()
    });

    this.answerHistory.push({
      puzzle: this.puzzles[this.currentIndex].puzzle,
      time: timeTaken,
      correct: isCorrect
    });
    // Keep only last 50 answers
    if (this.answerHistory.length > 50) this.answerHistory.shift();
    localStorage.setItem(getPlayerDataKey('answerHistory'), JSON.stringify(this.answerHistory));

    localStorage.setItem(getPlayerDataKey('competencyTable'), JSON.stringify(this.competencyTable));
    this.time.delayedCall(FEEDBACK_DELAY_MS, this.nextPuzzle, [], this);
  }

  nextPuzzle() {
    this.clearUI();
    this.currentIndex++;
    if (this.currentIndex < this.puzzles.length) {
      this.presentPuzzle();
    } else {
      this.scene.start('SummaryScene', { deltas: this.deltas, presented: this.puzzles, times: this.times, correctness: this.correctness });
    }
  }

  clearUI() {
    this.puzzleText.destroy();
    this.inputText.destroy();
    this.timerBar.destroy();
    this.feedbackText.destroy();
  }
}