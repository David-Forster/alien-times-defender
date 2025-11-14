import Phaser from 'phaser';
import { initialTable, GAME_LENGTH, EARLY_SESSION_THRESHOLD, ADAPTIVE_THRESHOLD, TIMER_DELAY_MS, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR, PUZZLE_FONT_SIZE, INPUT_FONT_SIZE, FEEDBACK_FONT_SIZE, SCREEN_CENTER_X, PUZZLE_Y, INPUT_Y, TIMER_BAR_Y, FEEDBACK_Y, FAST_TIME_THRESHOLD, SLOW_TIME_THRESHOLD, FAST_DECREASE, SLOW_DECREASE, INCORRECT_INCREASE, MIN_RATING, MAX_RATING, FEEDBACK_DELAY_MS, TIMEOUT_TIME } from '../constants';

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

  constructor() {
    super('PlayScene');
  }

  create() {
    if (localStorage.getItem('competencyTable')) {
      this.competencyTable = JSON.parse(localStorage.getItem('competencyTable')!);
    } else {
      this.competencyTable = initialTable;
    }

    this.playCount = parseInt(localStorage.getItem('playCount') || '0');
    this.playCount++;
    localStorage.setItem('playCount', this.playCount.toString());

    // Calculate the average user rating across all puzzles. This is used for the adaptive puzzle selection logic.
    const averageUserRating = this.competencyTable.reduce((sum, p) => sum + p.userRating, 0) / this.competencyTable.length;

    this.puzzles = [];

    if (this.playCount <= EARLY_SESSION_THRESHOLD) {
      // Broad shuffle for early sessions
      this.puzzles = Phaser.Utils.Array.Shuffle([...this.competencyTable]).slice(0, GAME_LENGTH);
    } else {
      this.puzzles = this.selectPuzzlesAdaptive(this.competencyTable, averageUserRating, GAME_LENGTH);
    }

    this.deltas = [];
    this.times = [];
    this.correctness = [];
    this.currentIndex = 0;
    this.presentPuzzle();
  }

  private selectPuzzlesAdaptive(competencyTable: Array<{ puzzle: string; rating: number; userRating: number }>, averageUserRating: number, gameLength: number): Array<{ puzzle: string; rating: number; userRating: number }> {
    // Methodology: This method performs adaptive weighted selection without replacement for puzzle selection.
    // If the player's average user rating is below 30, it uses the puzzle's base difficulty rating as weight.
    // Otherwise, it uses the player's personal user rating for that puzzle, making the selection adaptive to the player's skill.
    // It selects puzzles by weighted random choice, ensuring no puzzle is selected more than once.
    let candidates = [...competencyTable];
    const selected: Array<{ puzzle: string; rating: number; userRating: number }> = [];
    for (let i = 0; i < gameLength; i++) {
      const getWeight = (p: { rating: number; userRating: number }) => averageUserRating < ADAPTIVE_THRESHOLD ? p.rating : p.userRating;
      const totalWeight = candidates.reduce((sum, p) => sum + getWeight(p), 0);
      let rand = Math.random() * totalWeight;
      let selectedIndex = -1;
      for (let j = 0; j < candidates.length; j++) {
        rand -= getWeight(candidates[j]);
        if (rand <= 0) {
          selectedIndex = j;
          break;
        }
      }
      if (selectedIndex >= 0) {
        selected.push(candidates.splice(selectedIndex, 1)[0]);
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
    const entry = this.competencyTable.find((e) => e.puzzle === this.puzzles[this.currentIndex].puzzle)!;
    const before = entry.userRating;
    if (userAnswer === correct) {
      let decrease: number;
      if (timeTaken <= FAST_TIME_THRESHOLD) {
        decrease = FAST_DECREASE;
      } else if (timeTaken >= SLOW_TIME_THRESHOLD) {
        decrease = SLOW_DECREASE;
      } else {
        decrease = FAST_DECREASE + ((timeTaken - FAST_TIME_THRESHOLD) / (SLOW_TIME_THRESHOLD - FAST_TIME_THRESHOLD)) * (SLOW_DECREASE - FAST_DECREASE);
      }
      entry.userRating = Math.max(MIN_RATING, entry.userRating + decrease);
      this.feedbackText = this.add.text(SCREEN_CENTER_X, FEEDBACK_Y, `Correct! Time: ${timeTaken.toFixed(1)}s`, { fontSize: FEEDBACK_FONT_SIZE, color: '#00ff00' }).setOrigin(0.5);
    } else {
      entry.userRating = Math.min(MAX_RATING, entry.userRating + INCORRECT_INCREASE);
      this.feedbackText = this.add.text(SCREEN_CENTER_X, FEEDBACK_Y, `Incorrect. Answer was ${correct}`, { fontSize: FEEDBACK_FONT_SIZE, color: '#ff0000' }).setOrigin(0.5);
    }
    this.deltas.push(entry.userRating - before);
    localStorage.setItem('competencyTable', JSON.stringify(this.competencyTable));
    this.time.delayedCall(FEEDBACK_DELAY_MS, this.nextPuzzle, [], this);
  }

  onTimeout() {
    this.input.keyboard.off('keydown', this.handleKey, this);
    const entry = this.competencyTable.find((e) => e.puzzle === this.puzzles[this.currentIndex].puzzle)!;
    const before = entry.userRating;
    entry.userRating = Math.min(MAX_RATING, entry.userRating + INCORRECT_INCREASE);
    this.deltas.push(entry.userRating - before);
    localStorage.setItem('competencyTable', JSON.stringify(this.competencyTable));
    const [a, b] = this.puzzles[this.currentIndex].puzzle.split(' x ').map(Number);
    const correct = a * b;
    this.feedbackText = this.add.text(SCREEN_CENTER_X, INPUT_Y, `Timeout. Answer was ${correct}`, { fontSize: FEEDBACK_FONT_SIZE, color: '#ff0000' }).setOrigin(0.5);
    this.times.push(TIMEOUT_TIME);
    this.correctness.push(false);
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