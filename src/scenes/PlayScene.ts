import Phaser from 'phaser';
import { getActivePlayer } from '../utils/player';
import { TIMER_DELAY_MS, GAME_LENGTH } from '../constants';
import { PuzzleManager } from '../managers/PuzzleManager';
import { UIManager } from '../managers/UIManager';
import { GameMechanics } from '../managers/GameMechanics';
import { InputHandler } from '../managers/InputHandler';

export default class PlayScene extends Phaser.Scene {
  puzzleManager!: PuzzleManager;
  uiManager!: UIManager;
  gameMechanics!: GameMechanics;
  inputHandler!: InputHandler;
  reserveShips!: Phaser.GameObjects.Sprite[];
  stars!: Phaser.GameObjects.Blitter;
  starfieldHeight!: number;

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
    this.load.image('starfield', '/assets/starfield.avif');
    this.load.image('button_panel', '/assets/blue_panel.svg');
    this.load.image('feedback_panel', '/assets/red_panel.svg');
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
    for (let i = 0; i < GAME_LENGTH - 1; i++) {
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
    this.inputHandler.presentPuzzle();
  }

  update() {
    if (this.uiManager && this.uiManager.timerEvent && this.uiManager.timerEvent.getRemaining() < TIMER_DELAY_MS * 0.5) {
      this.uiManager.updatePuzzleShipPosition(this.uiManager.timerEvent);
    }

    this.stars.y += 1;
    this.stars.y %= this.starfieldHeight;
  }
}