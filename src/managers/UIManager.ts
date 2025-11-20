import Phaser from 'phaser';
import { PUZZLE_FONT_SIZE, INPUT_FONT_SIZE, FEEDBACK_FONT_SIZE, SCREEN_CENTER_X, PUZZLE_Y, INPUT_Y, TIMER_BAR_Y, FEEDBACK_Y, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR, GT_X, GT_Y, PS_START_Y, PS_MOVE_SPEED, SWOOP_SPEED, LIVES_COUNT, LIFE_ICON_SIZE, LIFE_ICON_SPACING, PROGRESS_X, PROGRESS_Y, TIMER_DELAY_MS } from '../constants';

export class UIManager {
  scene: Phaser.Scene;
  puzzleText!: Phaser.GameObjects.Text;
  inputText!: Phaser.GameObjects.Text;
  feedbackText!: Phaser.GameObjects.Text;
  feedbackAdded: boolean;
  timerBar!: Phaser.GameObjects.Rectangle;
  timerEvent!: Phaser.Time.TimerEvent;
  puzzleShip!: Phaser.GameObjects.Container;
  gunTurret!: Phaser.GameObjects.Sprite;
  progressText!: Phaser.GameObjects.Text;
  lifeIcons!: Phaser.GameObjects.Sprite[];
  psTween!: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.lifeIcons = [];
  }

  createAnimations() {
    this.scene.anims.create({
      key: 'explode',
      frames: this.scene.anims.generateFrameNumbers('explosion', { start: 0, end: 23 }),
      frameRate: 20,
      repeat: 0
    });

    this.scene.anims.create({
      key: 'thrust',
      frames: this.scene.anims.generateFrameNumbers('ship', { frames: [2, 7] }),
      frameRate: 20,
      repeat: -1
    });
  }

  createGunTurret() {
    this.gunTurret = this.scene.add.sprite(GT_X, GT_Y, 'ship');
    this.gunTurret.setScale(2);
    this.gunTurret.play('thrust');
  }

  createProgress() {
    this.progressText = this.scene.add.text(PROGRESS_X, PROGRESS_Y, '1 / 10', { fontSize: '24px', color: '#ffffff' }).setOrigin(1, 0);
  }

  createLives() {
    for (let i = 0; i < LIVES_COUNT; i++) {
      const icon = this.scene.add.sprite(50 + i * LIFE_ICON_SPACING, 550, 'ship');
      icon.setScale(1);
      this.lifeIcons.push(icon);
    }
  }

  presentPuzzle(puzzle: string) {
    this.gunTurret.setVisible(true);
    this.puzzleShip = this.scene.add.container(SCREEN_CENTER_X, PS_START_Y);
    const psSprite = this.scene.add.sprite(0, 0, 'enemy', 0);
    psSprite.setScale(0.5);
    this.puzzleShip.add(psSprite);
    this.puzzleShip.setDepth(10);
    this.scene.physics.world.enable(this.puzzleShip);

    this.puzzleText = this.scene.add.text(0, -50, puzzle, { fontSize: PUZZLE_FONT_SIZE, color: '#ffffff' }).setOrigin(0.5);
    this.puzzleShip.add(this.puzzleText);

    this.psTween = this.scene.tweens.add({
      targets: this.puzzleShip,
      x: { from: SCREEN_CENTER_X - 100, to: SCREEN_CENTER_X + 100, duration: 2000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 },
      y: { from: PS_START_Y, to: PS_START_Y + 50, duration: 3000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1, offset: 1000 },
      duration: 4000,
      repeat: -1
    });

    this.inputText = this.scene.add.text(GT_X + 200, GT_Y - 120, '', { fontSize: INPUT_FONT_SIZE, color: '#ffffff' }).setOrigin(0.5);
    this.timerBar = this.scene.add.rectangle(SCREEN_CENTER_X, TIMER_BAR_Y, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR).setOrigin(0.5);
    this.timerBar.setDepth(1);
    this.scene.tweens.add({
      targets: this.timerBar,
      scaleX: 0,
      duration: TIMER_DELAY_MS,
      ease: 'Linear',
    });
  }

  startTimer(callback: () => void) {
    this.timerEvent = this.scene.time.addEvent({ delay: TIMER_DELAY_MS, callback, callbackScope: this.scene });
  }

  stopTimer() {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.scene.tweens.killTweensOf(this.timerBar);
      this.timerEvent = null;
    }
  }

  updatePuzzleShipPosition(timerEvent: Phaser.Time.TimerEvent) {
    if (timerEvent.getRemaining() < TIMER_DELAY_MS * 0.5) {
      const progress = 1 - timerEvent.getRemaining() / TIMER_DELAY_MS;
      const targetY = PS_START_Y + (GT_Y - PS_START_Y) * (progress - 0.5) * 2;
      if (targetY > PS_START_Y) {
        this.puzzleShip.y = Math.max(PS_START_Y, targetY);
      }
    }
  }

  showFeedback(text: string, color: string, y: number = FEEDBACK_Y) {
    this.feedbackText = this.scene.add.text(SCREEN_CENTER_X, y, text, { fontSize: FEEDBACK_FONT_SIZE, color }).setOrigin(0.5);
    this.feedbackAdded = true;
  }

  showDeltaText(delta: number, x: number, y: number) {
    const deltaText = this.scene.add.text(x, y, `${delta > 0 ? '+' : ''}${delta}`, { fontSize: '32px', color: delta < 0 ? '#00ff00' : '#ff0000' }).setOrigin(0.5);
    this.scene.tweens.add({
      targets: deltaText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => deltaText.destroy()
    });
  }

  updateProgress(current: number, total: number) {
    this.progressText.setText(`${current} / ${total}`);
  }

  clearUI() {
    console.log('before:', this.puzzleText);
    this.puzzleText.destroy();
    console.log('after:', this.puzzleText);
    this.inputText.destroy();
    this.timerBar.destroy();
    if (this.feedbackAdded) {
      this.feedbackText.destroy();
      this.feedbackAdded = false;
    }
    this.puzzleShip.destroy();
  }

  destroyLifeIcon(index: number) {
    if (index >= 0 && index < this.lifeIcons.length) {
      this.lifeIcons[index].destroy();
    }
  }

  stopPuzzleShipTween() {
    if (this.psTween) {
      this.psTween.stop();
    }
  }

  swoopPuzzleShip(onComplete: () => void) {
    this.scene.tweens.add({
      targets: this.puzzleShip,
      y: GT_Y,
      duration: (GT_Y - this.puzzleShip.y) / SWOOP_SPEED * 1000,
      ease: 'Linear',
      onComplete
    });
  }
}