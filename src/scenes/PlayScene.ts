import Phaser from 'phaser';
import { getActivePlayer } from '../utils/player';
import { TIMER_DELAY_MS, GAME_LENGTH } from '../constants';
import { PuzzleManager } from '../managers/PuzzleManager';
import { UIManager } from '../managers/UIManager';
import { GameMechanics } from '../managers/GameMechanics';
import { InputHandler } from '../managers/InputHandler';
import { getRandomStarfieldPath } from '../utils/starfieldSelector';

export default class PlayScene extends Phaser.Scene {
  puzzleManager!: PuzzleManager;
  uiManager!: UIManager;
  gameMechanics!: GameMechanics;
  inputHandler!: InputHandler;
  reserveShips!: Phaser.GameObjects.Sprite[];
  stars!: Phaser.GameObjects.Blitter;
  starfieldHeight!: number;
  puzzlePresentationSound!: Phaser.Sound.BaseSound;
  correctAnswerSound!: Phaser.Sound.BaseSound;
  correctAnswerPostSound!: Phaser.Sound.BaseSound;
  incorrectAnswerSound!: Phaser.Sound.BaseSound;
  explosionSound!: Phaser.Sound.BaseSound;
  timerWarningSound!: Phaser.Sound.BaseSound;
  sessionEndSound!: Phaser.Sound.BaseSound;
  backgroundMusic!: Phaser.Sound.BaseSound;
  timerWarningPlayed: boolean;
  warningActive: boolean;

  constructor() {
    super('PlayScene');
  }

  preload() {
    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 64,
      frameHeight: 64,
      endFrame: 23
    });
    this.load.spritesheet('enemy', '/assets/bsquadron-enemies.png', {
      frameWidth: 192,
      frameHeight: 160
    });
    this.load.spritesheet('ship', '/assets/ship.png', {
      frameWidth: 16,
      frameHeight: 24
    });
    this.load.image('bullet', '/assets/bullet7.png');
    const path = '/' + getRandomStarfieldPath();
    this.load.image('starfield', path);
    this.load.image('button_panel', '/assets/blue_panel.svg');
    this.load.image('feedback_panel', '/assets/red_panel.svg');

    // Load sound effects
    this.load.audio('puzzlePresentation', '/assets/doorOpen_000.ogg');
    this.load.audio('correctAnswer', '/assets/laserRetro_000.ogg');
    this.load.audio('correctAnswerPost', '/assets/explosionCrunch_000.ogg');
    this.load.audio('incorrectAnswer', '/assets/explosionCrunch_004.ogg');
    this.load.audio('timerWarning', '/assets/impactMetal_003.ogg');
    this.load.audio('sessionEnd', '/assets/doorClose_000.ogg');
    this.load.audio('backgroundMusic', '/assets/ObservingTheStar.ogg');
  }

  create() {
    const player = getActivePlayer();
    if (!player) {
      this.scene.start('MenuScene');
      return;
    }

    this.stars = this.add.blitter(0, 0, 'starfield');
    this.starfieldHeight = this.textures.get('starfield').getSourceImage().height;
    this.stars.create(0, 0);
    this.stars.create(0, -this.starfieldHeight);

    this.puzzleManager = new PuzzleManager();
    this.puzzleManager.loadData();

    this.uiManager = new UIManager(this);
    this.uiManager.createAnimations();
    this.uiManager.createGunTurret();
    this.uiManager.createProgress();
    this.uiManager.createLives();

    this.reserveShips = [];
    for (let i = 0; i <= GAME_LENGTH - 1; i++) {
      const x = Phaser.Math.Between(100, 700);
      const y = Phaser.Math.Between(50, 100);
      const ship = this.add.sprite(x, y, 'enemy', 0);
      ship.setScale(0.2);
      ship.setAlpha(0.5);
      this.tweens.add({
        targets: ship,
        x: x + 20,
        duration: 2000,
        yoyo: true,
        repeat: -1
      });
      this.reserveShips.push(ship);
    }

    this.gameMechanics = new GameMechanics(this, this.uiManager, (deltas, presented, times, correctness) => {
      this.scene.start('SummaryScene', { deltas, presented, times, correctness });
    });
    this.gameMechanics.createMissiles();

    this.inputHandler = new InputHandler(this, this.puzzleManager, this.uiManager, this.gameMechanics);

    // Create sound objects
    this.puzzlePresentationSound = this.sound.add('puzzlePresentation', { volume: 0.5 });
    this.correctAnswerSound = this.sound.add('correctAnswer', { volume: 0.2 });
    this.correctAnswerPostSound = this.sound.add('correctAnswerPost', { volume: 0.5 });
    this.incorrectAnswerSound = this.sound.add('incorrectAnswer', { volume: 0.5 });
    this.explosionSound = this.sound.add('incorrectAnswer');
    this.timerWarningSound = this.sound.add('timerWarning');
    this.sessionEndSound = this.sound.add('sessionEnd');
    this.backgroundMusic = this.sound.add('backgroundMusic');
    this.timerWarningPlayed = false;
    this.warningActive = false;

    // Audio unlock on pointerdown
    this.input.on('pointerdown', () => {
      if (this.sound.locked) {
        this.sound.unlock();
      }
    });

    if (!this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play({ loop: true });
    }

    this.inputHandler.presentPuzzle();
  }

  startWarning() {
    this.playWarningBeat();
  }

  playWarningBeat() {
    if (!this.uiManager.timerEvent) {
      this.warningActive = false;
      return;
    }
    const remaining = this.uiManager.timerEvent.getRemaining();
    if (remaining <= 0) {
      this.warningActive = false;
      return;
    }
    const warningStart = TIMER_DELAY_MS * 0.3;
    const progress = remaining / warningStart;
    const volume = 0.2 + 0.8 * (1 - progress);
    const interval = (0.1 + 0.9 * progress) * 1000;
    this.timerWarningSound.play({ volume });
    this.time.addEvent({
      delay: interval,
      callback: this.playWarningBeat,
      callbackScope: this
    });
  }

  update() {
    if (this.uiManager && this.uiManager.timerEvent && this.uiManager.timerEvent.getRemaining() > 0) {
      const elapsed = (Date.now() - this.inputHandler.startTime) / 1000;
      const color = this.puzzleManager.getTimeTakenColor(elapsed);
      this.uiManager.updateTimerBarColor(color);
    }
    if (this.uiManager && this.uiManager.timerEvent && this.uiManager.timerEvent.getRemaining() < TIMER_DELAY_MS * 0.5) {
      this.uiManager.updatePuzzleShipPosition(this.uiManager.timerEvent);
    }
    if (this.uiManager && this.uiManager.timerEvent && this.uiManager.timerEvent.getRemaining() < TIMER_DELAY_MS * 0.3 && !this.warningActive) {
      this.warningActive = true;
      this.startWarning();
    }

    this.stars.y += 1;
    this.stars.y %= this.starfieldHeight;
  }
}