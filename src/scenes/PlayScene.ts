import Phaser from 'phaser';
import { getActivePlayer } from '../utils/player';
import { TIMER_DELAY_MS } from '../constants';
import { PuzzleManager } from '../managers/PuzzleManager';
import { UIManager } from '../managers/UIManager';
import { GameMechanics } from '../managers/GameMechanics';
import { InputHandler } from '../managers/InputHandler';

export default class PlayScene extends Phaser.Scene {
  puzzleManager!: PuzzleManager;
  uiManager!: UIManager;
  gameMechanics!: GameMechanics;
  inputHandler!: InputHandler;
  stars!: Phaser.GameObjects.Blitter;

  constructor() {
    super('PlayScene');
  }

  preload() {
    this.load.spritesheet('explosion', 'src/assets/explosion.png', {
      frameWidth: 64,
      frameHeight: 64,
      endFrame: 23
    });
    this.load.spritesheet('enemy', 'src/assets/bsquadron-enemies.png', {
      frameWidth: 192,
      frameHeight: 160
    });
    this.load.spritesheet('ship', 'src/assets/ship.png', {
      frameWidth: 16,
      frameHeight: 24
    });
    this.load.image('bullet', 'src/assets/bullet7.png');
    this.load.image('starfield', 'src/assets/starfield.png');
    this.load.image('button_panel', 'src/assets/blue_panel.svg');
    this.load.image('feedback_panel', 'src/assets/red_panel.svg');
  }

  create() {
    const player = getActivePlayer();
    if (!player) {
      this.scene.start('MenuScene');
      return;
    }

    this.stars = this.add.blitter(0, 0, 'starfield');
    this.stars.create(0, 0);
    this.stars.create(512, 0);
    this.stars.create(0, -512);
    this.stars.create(512, -512);

    this.puzzleManager = new PuzzleManager();
    this.puzzleManager.loadData();

    this.uiManager = new UIManager(this);
    this.uiManager.createAnimations();
    this.uiManager.createGunTurret();
    this.uiManager.createProgress();
    this.uiManager.createLives();

    this.gameMechanics = new GameMechanics(this, this.uiManager, (deltas, presented, times, correctness) => {
      this.scene.start('SummaryScene', { deltas, presented, times, correctness });
    });
    this.gameMechanics.createMissiles();

    this.inputHandler = new InputHandler(this, this.puzzleManager, this.uiManager, this.gameMechanics);
    this.inputHandler.presentPuzzle();
  }

  update() {
    if (this.uiManager && this.uiManager.timerEvent && this.uiManager.timerEvent.getRemaining() < TIMER_DELAY_MS * 0.5) {
      this.uiManager.updatePuzzleShipPosition(this.uiManager.timerEvent);
    }

    this.stars.y += 1;
    this.stars.y %= 512;
  }
}