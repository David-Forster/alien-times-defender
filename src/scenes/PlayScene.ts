import Phaser from 'phaser';

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

  constructor() {
    super('PlayScene');
  }

  create() {
    const initialTable = [
      { "puzzle": "2 x 2", "rating": 1, "userRating": 1 },
      { "puzzle": "2 x 5", "rating": 1, "userRating": 1 },
      { "puzzle": "2 x 10", "rating": 1, "userRating": 1 },
      { "puzzle": "5 x 2", "rating": 1, "userRating": 1 },
      { "puzzle": "5 x 5", "rating": 1, "userRating": 1 },
      { "puzzle": "5 x 10", "rating": 1, "userRating": 1 },
      { "puzzle": "10 x 2", "rating": 1, "userRating": 1 },
      { "puzzle": "10 x 5", "rating": 1, "userRating": 1 },
      { "puzzle": "10 x 10", "rating": 1, "userRating": 1 },
      { "puzzle": "2 x 4", "rating": 3, "userRating": 3 },
      { "puzzle": "2 x 11", "rating": 3, "userRating": 3 },
      { "puzzle": "4 x 2", "rating": 3, "userRating": 3 },
      { "puzzle": "4 x 5", "rating": 3, "userRating": 3 },
      { "puzzle": "4 x 10", "rating": 3, "userRating": 3 },
      { "puzzle": "5 x 4", "rating": 3, "userRating": 3 },
      { "puzzle": "5 x 11", "rating": 3, "userRating": 3 },
      { "puzzle": "10 x 4", "rating": 3, "userRating": 3 },
      { "puzzle": "10 x 11", "rating": 3, "userRating": 3 },
      { "puzzle": "11 x 2", "rating": 3, "userRating": 3 },
      { "puzzle": "11 x 5", "rating": 3, "userRating": 3 },
      { "puzzle": "11 x 10", "rating": 3, "userRating": 3 },
      { "puzzle": "2 x 3", "rating": 5, "userRating": 5 },
      { "puzzle": "3 x 2", "rating": 5, "userRating": 5 },
      { "puzzle": "3 x 5", "rating": 5, "userRating": 5 },
      { "puzzle": "3 x 10", "rating": 5, "userRating": 5 },
      { "puzzle": "4 x 4", "rating": 5, "userRating": 5 },
      { "puzzle": "4 x 11", "rating": 5, "userRating": 5 },
      { "puzzle": "5 x 3", "rating": 5, "userRating": 5 },
      { "puzzle": "10 x 3", "rating": 5, "userRating": 5 },
      { "puzzle": "11 x 4", "rating": 5, "userRating": 5 },
      { "puzzle": "11 x 11", "rating": 5, "userRating": 5 },
      { "puzzle": "2 x 9", "rating": 8, "userRating": 8 },
      { "puzzle": "3 x 4", "rating": 8, "userRating": 8 },
      { "puzzle": "3 x 11", "rating": 8, "userRating": 8 },
      { "puzzle": "4 x 3", "rating": 8, "userRating": 8 },
      { "puzzle": "5 x 9", "rating": 8, "userRating": 8 },
      { "puzzle": "9 x 2", "rating": 8, "userRating": 8 },
      { "puzzle": "9 x 5", "rating": 8, "userRating": 8 },
      { "puzzle": "9 x 10", "rating": 8, "userRating": 8 },
      { "puzzle": "10 x 9", "rating": 8, "userRating": 8 },
      { "puzzle": "11 x 3", "rating": 8, "userRating": 8 },
      { "puzzle": "2 x 6", "rating": 10, "userRating": 10 },
      { "puzzle": "3 x 3", "rating": 10, "userRating": 10 },
      { "puzzle": "4 x 9", "rating": 10, "userRating": 10 },
      { "puzzle": "5 x 6", "rating": 10, "userRating": 10 },
      { "puzzle": "6 x 2", "rating": 10, "userRating": 10 },
      { "puzzle": "6 x 5", "rating": 10, "userRating": 10 },
      { "puzzle": "6 x 10", "rating": 10, "userRating": 10 },
      { "puzzle": "9 x 4", "rating": 10, "userRating": 10 },
      { "puzzle": "9 x 11", "rating": 10, "userRating": 10 },
      { "puzzle": "10 x 6", "rating": 10, "userRating": 10 },
      { "puzzle": "11 x 9", "rating": 10, "userRating": 10 },
      { "puzzle": "2 x 7", "rating": 13, "userRating": 13 },
      { "puzzle": "3 x 9", "rating": 13, "userRating": 13 },
      { "puzzle": "4 x 6", "rating": 13, "userRating": 13 },
      { "puzzle": "5 x 7", "rating": 13, "userRating": 13 },
      { "puzzle": "6 x 4", "rating": 13, "userRating": 13 },
      { "puzzle": "6 x 11", "rating": 13, "userRating": 13 },
      { "puzzle": "7 x 2", "rating": 13, "userRating": 13 },
      { "puzzle": "7 x 5", "rating": 13, "userRating": 13 },
      { "puzzle": "7 x 10", "rating": 13, "userRating": 13 },
      { "puzzle": "9 x 3", "rating": 13, "userRating": 13 },
      { "puzzle": "10 x 7", "rating": 13, "userRating": 13 },
      { "puzzle": "11 x 6", "rating": 13, "userRating": 13 },
      { "puzzle": "2 x 8", "rating": 15, "userRating": 15 },
      { "puzzle": "3 x 6", "rating": 15, "userRating": 15 },
      { "puzzle": "5 x 8", "rating": 15, "userRating": 15 },
      { "puzzle": "6 x 3", "rating": 15, "userRating": 15 },
      { "puzzle": "7 x 11", "rating": 15, "userRating": 15 },
      { "puzzle": "8 x 2", "rating": 15, "userRating": 15 },
      { "puzzle": "8 x 5", "rating": 15, "userRating": 15 },
      { "puzzle": "8 x 10", "rating": 15, "userRating": 15 },
      { "puzzle": "9 x 9", "rating": 15, "userRating": 15 },
      { "puzzle": "10 x 8", "rating": 15, "userRating": 15 },
      { "puzzle": "11 x 7", "rating": 15, "userRating": 15 },
      { "puzzle": "2 x 12", "rating": 18, "userRating": 18 },
      { "puzzle": "3 x 7", "rating": 18, "userRating": 18 },
      { "puzzle": "5 x 12", "rating": 18, "userRating": 18 },
      { "puzzle": "6 x 9", "rating": 18, "userRating": 18 },
      { "puzzle": "7 x 3", "rating": 18, "userRating": 18 },
      { "puzzle": "8 x 11", "rating": 18, "userRating": 18 },
      { "puzzle": "9 x 6", "rating": 18, "userRating": 18 },
      { "puzzle": "10 x 12", "rating": 18, "userRating": 18 },
      { "puzzle": "11 x 8", "rating": 18, "userRating": 18 },
      { "puzzle": "12 x 2", "rating": 18, "userRating": 18 },
      { "puzzle": "12 x 5", "rating": 18, "userRating": 18 },
      { "puzzle": "12 x 10", "rating": 18, "userRating": 18 },
      { "puzzle": "3 x 8", "rating": 20, "userRating": 20 },
      { "puzzle": "4 x 12", "rating": 20, "userRating": 20 },
      { "puzzle": "6 x 6", "rating": 20, "userRating": 20 },
      { "puzzle": "8 x 3", "rating": 20, "userRating": 20 },
      { "puzzle": "12 x 4", "rating": 20, "userRating": 20 },
      { "puzzle": "3 x 12", "rating": 23, "userRating": 23 },
      { "puzzle": "8 x 9", "rating": 23, "userRating": 23 },
      { "puzzle": "9 x 8", "rating": 23, "userRating": 23 },
      { "puzzle": "12 x 3", "rating": 23, "userRating": 23 },
      { "puzzle": "6 x 12", "rating": 28, "userRating": 28 },
      { "puzzle": "12 x 6", "rating": 28, "userRating": 28 },
      { "puzzle": "7 x 12", "rating": 30, "userRating": 30 },
      { "puzzle": "12 x 7", "rating": 30, "userRating": 30 },
      { "puzzle": "4 x 7", "rating": 52, "userRating": 52 },
      { "puzzle": "7 x 4", "rating": 52, "userRating": 52 },
      { "puzzle": "7 x 7", "rating": 62, "userRating": 62 },
      { "puzzle": "4 x 8", "rating": 67, "userRating": 67 },
      { "puzzle": "8 x 4", "rating": 67, "userRating": 67 },
      { "puzzle": "7 x 9", "rating": 70, "userRating": 70 },
      { "puzzle": "9 x 7", "rating": 70, "userRating": 70 },
      { "puzzle": "6 x 7", "rating": 72, "userRating": 72 },
      { "puzzle": "7 x 6", "rating": 72, "userRating": 72 },
      { "puzzle": "9 x 12", "rating": 75, "userRating": 75 },
      { "puzzle": "12 x 9", "rating": 75, "userRating": 75 },
      { "puzzle": "8 x 8", "rating": 80, "userRating": 80 },
      { "puzzle": "11 x 12", "rating": 82, "userRating": 82 },
      { "puzzle": "12 x 11", "rating": 82, "userRating": 82 },
      { "puzzle": "7 x 8", "rating": 90, "userRating": 90 },
      { "puzzle": "8 x 7", "rating": 90, "userRating": 90 },
      { "puzzle": "8 x 12", "rating": 95, "userRating": 95 },
      { "puzzle": "12 x 8", "rating": 95, "userRating": 95 },
      { "puzzle": "12 x 12", "rating": 97, "userRating": 97 },
      { "puzzle": "6 x 8", "rating": 100, "userRating": 100 },
      { "puzzle": "8 x 6", "rating": 100, "userRating": 100 }
    ];

    if (localStorage.getItem('competencyTable')) {
      this.competencyTable = JSON.parse(localStorage.getItem('competencyTable')!);
    } else {
      this.competencyTable = initialTable;
    }

    this.playCount = parseInt(localStorage.getItem('playCount') || '0');
    this.playCount++;
    localStorage.setItem('playCount', this.playCount.toString());

    const averageUserRating = this.competencyTable.reduce((sum, p) => sum + p.userRating, 0) / this.competencyTable.length;

    const GAME_LENGTH = 20;
    this.puzzles = [];

    if (this.playCount <= 3) {
      // Broad shuffle for early sessions
      this.puzzles = Phaser.Utils.Array.Shuffle([...this.competencyTable]).slice(0, GAME_LENGTH);
    } else {
      // Adaptive weighted selection without replacement
      let candidates = [...this.competencyTable];
      for (let i = 0; i < GAME_LENGTH; i++) {
        const getWeight = (p: { rating: number; userRating: number }) => averageUserRating < 30 ? p.rating : p.userRating;
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
          this.puzzles.push(candidates.splice(selectedIndex, 1)[0]);
        }
      }
    }

    this.deltas = [];
    this.currentIndex = 0;
    this.presentPuzzle();
  }

  presentPuzzle() {
    const puzzle = this.puzzles[this.currentIndex];
    this.puzzleText = this.add.text(400, 200, puzzle.puzzle + ' = ', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    this.inputText = this.add.text(400, 250, '', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    this.answer = '';
    this.startTime = Date.now();
    this.timerEvent = this.time.addEvent({ delay: 25000, callback: this.onTimeout, callbackScope: this });
    this.timerBar = this.add.rectangle(400, 150, 400, 20, 0x00ff00).setOrigin(0.5);
    this.tweens.add({
      targets: this.timerBar,
      scaleX: 0,
      duration: 25000,
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
    const entry = this.competencyTable.find((e) => e.puzzle === this.puzzles[this.currentIndex].puzzle)!;
    const before = entry.userRating;
    if (userAnswer === correct) {
      let decrease: number;
      if (timeTaken <= 5) {
        decrease = -5;
      } else if (timeTaken >= 20) {
        decrease = -1;
      } else {
        decrease = -5 + ((timeTaken - 5) / 15) * 4;
      }
      entry.userRating = Math.max(1, entry.userRating + decrease);
      this.feedbackText = this.add.text(400, 300, `Correct! Time: ${timeTaken.toFixed(1)}s`, { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);
    } else {
      entry.userRating = Math.min(100, entry.userRating + 5);
      this.feedbackText = this.add.text(400, 300, `Incorrect. Answer was ${correct}`, { fontSize: '24px', color: '#ff0000' }).setOrigin(0.5);
    }
    this.deltas.push(entry.userRating - before);
    localStorage.setItem('competencyTable', JSON.stringify(this.competencyTable));
    this.time.delayedCall(2000, this.nextPuzzle, [], this);
  }

  onTimeout() {
    this.input.keyboard.off('keydown', this.handleKey, this);
    const entry = this.competencyTable.find((e) => e.puzzle === this.puzzles[this.currentIndex].puzzle)!;
    const before = entry.userRating;
    entry.userRating = Math.min(100, entry.userRating + 5);
    this.deltas.push(entry.userRating - before);
    localStorage.setItem('competencyTable', JSON.stringify(this.competencyTable));
    const [a, b] = this.puzzles[this.currentIndex].puzzle.split(' x ').map(Number);
    const correct = a * b;
    this.feedbackText = this.add.text(400, 300, `Timeout. Answer was ${correct}`, { fontSize: '24px', color: '#ff0000' }).setOrigin(0.5);
    this.time.delayedCall(2000, this.nextPuzzle, [], this);
  }

  nextPuzzle() {
    this.clearUI();
    this.currentIndex++;
    if (this.currentIndex < this.puzzles.length) {
      this.presentPuzzle();
    } else {
      this.scene.start('SummaryScene', { deltas: this.deltas, presented: this.puzzles });
    }
  }

  clearUI() {
    this.puzzleText.destroy();
    this.inputText.destroy();
    this.timerBar.destroy();
    this.feedbackText.destroy();
  }
}