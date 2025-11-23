import Phaser from 'phaser';
import { CORRECT_FEEDBACK_DELAY_MS, TIMEOUT_TIME, GT_X, GT_Y, INPUT_Y, SCREEN_CENTER_X, FEEDBACK_Y, INCORRECT_FEEDBACK_DELAY_MS } from '../constants';
import { PuzzleManager } from './PuzzleManager';
import { UIManager } from './UIManager';
import { GameMechanics } from './GameMechanics';

export class InputHandler {
  scene: Phaser.Scene;
  puzzleManager: PuzzleManager;
  uiManager: UIManager;
  gameMechanics: GameMechanics;
  answer: string;
  startTime: number;

  constructor(scene: Phaser.Scene, puzzleManager: PuzzleManager, uiManager: UIManager, gameMechanics: GameMechanics) {
    this.scene = scene;
    this.puzzleManager = puzzleManager;
    this.uiManager = uiManager;
    this.gameMechanics = gameMechanics;
    this.answer = '';
    this.startTime = 0;
  }

  setupInput() {
    this.scene.input.keyboard.on('keydown', this.handleKey, this);
  }

  removeInput() {
    this.scene.input.keyboard.off('keydown', this.handleKey, this);
  }

  handleKey(event: KeyboardEvent) {
    if (event.key >= '0' && event.key <= '9') {
      this.answer += event.key;
      this.uiManager.setInputText(this.answer);
    } else if (event.key === 'Backspace') {
      this.answer = this.answer.slice(0, -1);
      this.uiManager.setInputText(this.answer);
    } else if (event.key === 'Enter') {
      this.submitAnswer();
    }
  }

  submitAnswer() {
    this.removeInput();
    this.uiManager.stopTimer();
    const timeTaken = (Date.now() - this.startTime) / 1000;
    this.uiManager.updateTimerBarColor(this.puzzleManager.getTimeTakenColor(timeTaken));
    const puzzle = this.puzzleManager.getCurrentPuzzle();
    const [a, b] = puzzle.puzzle.split(' x ').map(Number);
    const correct = a * b;
    const userAnswer = parseInt(this.answer) || 0;
    const isCorrect = userAnswer === correct;
    const delta = this.puzzleManager.updateRating(puzzle.puzzle, isCorrect, timeTaken);
    this.puzzleManager.recordAnswer(puzzle.puzzle, timeTaken, isCorrect);

    this.uiManager.stopPuzzleShipTween();

    if (isCorrect) {
      this.gameMechanics.fireMissile(this.uiManager.puzzleShip, timeTaken);
      this.gameMechanics.setupCollision(this.uiManager.puzzleShip, delta);
    } else {
      this.gameMechanics.explodeGunTurret();
      this.gameMechanics.loseLife(this.puzzleManager, this.uiManager);
      this.uiManager.showFeedback(`Overheated!! Correct sequence was: ${correct}`, '#ffffff', INPUT_Y);
      this.uiManager.showDeltaText(delta, this.uiManager.gunTurret.x + 130, this.uiManager.gunTurret.y);
    }

    this.scene.time.delayedCall(isCorrect ? CORRECT_FEEDBACK_DELAY_MS : INCORRECT_FEEDBACK_DELAY_MS, this.nextPuzzle, [], this);
  }

  onTimeout() {
    this.removeInput();
    const timeTaken = TIMEOUT_TIME;
    this.uiManager.updateTimerBarColor(this.puzzleManager.getTimeTakenColor(timeTaken));
    const isCorrect = false;
    const puzzle = this.puzzleManager.getCurrentPuzzle();
    const delta = this.puzzleManager.updateRating(puzzle.puzzle, isCorrect, timeTaken);
    this.puzzleManager.recordAnswer(puzzle.puzzle, timeTaken, isCorrect);

    this.uiManager.stopPuzzleShipTween();

    this.uiManager.swoopPuzzleShip(() => {
      this.gameMechanics.createExplosion(GT_X, GT_Y, -2);
      this.uiManager.puzzleShip.destroy();
      this.gameMechanics.loseLife(this.puzzleManager, this.uiManager);
    });

    const [a, b] = puzzle.puzzle.split(' x ').map(Number);
    const correct = a * b;
    this.uiManager.showFeedback(`Overheated!! Correct sequence was: ${correct}`, '#ffffff', INPUT_Y);

    this.uiManager.showDeltaText(delta, this.uiManager.puzzleShip.x + 100, this.uiManager.puzzleShip.y);

    this.scene.time.delayedCall(INCORRECT_FEEDBACK_DELAY_MS, this.nextPuzzle, [], this);
  }

  nextPuzzle() {
    this.uiManager.clearUI();
    this.gameMechanics.clearMissiles();
    const hasNext = this.puzzleManager.nextPuzzle();
    const progress = this.puzzleManager.getProgress();
    this.uiManager.updateProgress(progress.current, progress.total);
    if (hasNext && this.gameMechanics.lives > 0) {
      this.presentPuzzle();
    } else {
      this.scene.scene.start('SummaryScene', {
        deltas: this.puzzleManager.deltas,
        presented: this.puzzleManager.puzzles.slice(0, this.puzzleManager.currentIndex),
        times: this.puzzleManager.times,
        correctness: this.puzzleManager.correctness
      });
    }
  }

  presentPuzzle() {
    const puzzle = this.puzzleManager.getCurrentPuzzle();
    let initialX = 400;
    let initialY = 100;
    let initialScale = 0.5;
    const initialFontSize = '36px';
    if ((this.scene as any).reserveShips && (this.scene as any).reserveShips.length > 0) {
      const randomIndex = Phaser.Math.Between(0, (this.scene as any).reserveShips.length - 1);
      const ship = (this.scene as any).reserveShips.splice(randomIndex, 1)[0];
      initialX = ship.x;
      initialY = ship.y;
      initialScale = 0.2;
      ship.destroy();
    }
    this.uiManager.presentPuzzle(puzzle.puzzle, initialX, initialY, initialScale, initialFontSize);
    this.answer = '';
    this.startTime = Date.now();
    this.uiManager.startTimer(() => this.onTimeout());
    this.setupInput();
  }
}