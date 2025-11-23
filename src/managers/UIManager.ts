import Phaser from 'phaser';
import { PUZZLE_FONT_SIZE, INPUT_FONT_SIZE, FEEDBACK_FONT_SIZE, SCREEN_CENTER_X, PUZZLE_Y, INPUT_Y, TIMER_BAR_Y, FEEDBACK_Y, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR, GT_X, GT_Y, PS_START_Y, PS_MOVE_SPEED, SWOOP_SPEED, LIVES_COUNT, LIFE_ICON_SIZE, LIFE_ICON_SPACING, PROGRESS_X, PROGRESS_Y, TIMER_DELAY_MS } from '../constants';

export class UIManager {
  scene: Phaser.Scene;
  puzzleText!: Phaser.GameObjects.Text;
  inputContainer!: Phaser.GameObjects.Container;
  inputPanelSprite!: Phaser.GameObjects.Sprite;
  inputText!: Phaser.GameObjects.Text;
  feedbackText!: Phaser.GameObjects.Text;
  feedbackContainer!: Phaser.GameObjects.Container;
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
    this.progressText = this.scene.add.text(PROGRESS_X, PROGRESS_Y, '1 / 10', { fontSize: '24px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(1, 0);
  }

  createLives() {
    for (let i = 0; i < LIVES_COUNT; i++) {
      const icon = this.scene.add.sprite(50 + i * LIFE_ICON_SPACING, 550, 'ship');
      icon.setScale(1);
      this.lifeIcons.push(icon);
    }
  }

  presentPuzzle(puzzle: string, initialX: number = 400, initialY: number = 100, initialScale: number = 0.5, initialFontSize: string = '48px') {
    this.gunTurret.setVisible(true);
    this.puzzleShip = this.scene.add.container(initialX, initialY);
    const psSprite = this.scene.add.sprite(0, 0, 'enemy', 0);
    psSprite.setScale(initialScale);
    this.puzzleShip.add(psSprite);
    this.puzzleShip.setDepth(10);
    this.scene.physics.world.enable(this.puzzleShip);

    this.puzzleText = this.scene.add.text(0, -60, puzzle, { fontSize: initialFontSize, color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0.5);
    this.puzzleText.setScale(initialScale);
    this.puzzleShip.add(this.puzzleText);

    // Entry tweens
    this.scene.tweens.add({
      targets: this.puzzleShip,
      x: SCREEN_CENTER_X - 100,
      y: PS_START_Y,
      duration: 1000,
      ease: 'Power2'
    });
    this.scene.tweens.add({
      targets: psSprite,
      scale: 0.5,
      duration: 1000
    });
    this.scene.tweens.add({
      targets: this.puzzleText,
      scale: 1,
      duration: 1000,
      onComplete: () => {
        this.psTween = this.scene.tweens.add({
          targets: this.puzzleShip,
          x: { from: SCREEN_CENTER_X - 100, to: SCREEN_CENTER_X + 100, duration: 2000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 },
          y: { from: PS_START_Y, to: PS_START_Y + 50, duration: 3000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1, offset: 1000 },
          duration: 4000,
          repeat: -1
        });
      }
    });

    this.inputContainer = this.scene.add.container(GT_X + 200, GT_Y - 120);
    this.inputPanelSprite = this.scene.add.sprite(0, 0, 'button_panel');
    this.inputPanelSprite.setScale(1, 2); // Make it taller to exceed font size
    this.inputPanelSprite.setAlpha(0.7); // Make translucent
    this.inputPanelSprite.setVisible(false); // Hide initially since no text
    this.inputContainer.add(this.inputPanelSprite);
    this.inputText = this.scene.add.text(0, 0, '', { fontSize: INPUT_FONT_SIZE, color: '#ffffff', fontFamily: 'Orbitron', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
    this.inputContainer.add(this.inputText);
    this.timerBar = this.scene.add.rectangle(SCREEN_CENTER_X, TIMER_BAR_Y, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR).setOrigin(0.5);
    this.timerBar.setDepth(1);
    this.scene.tweens.add({
      targets: this.timerBar,
      scaleX: 0,
      duration: TIMER_DELAY_MS,
      ease: 'Linear',
    });
  }

  setInputText(text: string) {
    this.inputText.setText(text);
    if (text.length > 0) {
      this.inputPanelSprite.setVisible(true);
      this.updateInputPanelSize();
    } else {
      this.inputPanelSprite.setVisible(false);
    }
  }

  updateInputPanelSize() {
    const textWidth = this.inputText.width;
    const baseWidth = 192; // SVG width
    const scaleX = Math.max(1, textWidth / baseWidth * 1.2); // Add some padding
    this.inputPanelSprite.setScale(scaleX, 2); // Keep height scaled to exceed font size
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
    // Hide input panel and text
    this.inputContainer.setVisible(false);

    this.feedbackContainer = this.scene.add.container(SCREEN_CENTER_X, y);
    const panelSprite = this.scene.add.sprite(0, 0, 'feedback_panel').setScale(2); // Double the size
    // Split text: assume format "Overheated!! Correct sequence was: X"
    const parts = text.split(' Correct sequence was: ');
    const topText = parts[0] + ' Correct sequence was:';
    const bottomText = parts[1];
    const topTextObj = this.scene.add.text(0, -30, topText, { fontSize: '20px', color, fontFamily: 'Orbitron' }).setOrigin(0.5);
    const bottomTextObj = this.scene.add.text(0, 20, bottomText, { fontSize: '48px', color, fontFamily: 'Orbitron' }).setOrigin(0.5);
    this.feedbackContainer.add(panelSprite);
    this.feedbackContainer.add(topTextObj);
    this.feedbackContainer.add(bottomTextObj);
    this.feedbackContainer.setDepth(15);
    this.feedbackAdded = true;

    // Blink the panel a couple of times quickly
    this.scene.tweens.add({
      targets: this.feedbackContainer,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 3,
      ease: 'Linear'
    });
  }

  showDeltaText(delta: number, x: number, y: number) {
    const isCorrect = delta < 0;
    const displayText = isCorrect ? `+${Math.abs(delta)}` : `-${delta}`;
    const color = isCorrect ? '#00ff00' : '#ff0000';
    const targetY = isCorrect ? y - 50 : y + 50;
    const deltaText = this.scene.add.text(x, y, displayText, { fontSize: '32px', color, fontFamily: 'Orbitron' }).setOrigin(0.5);
    this.scene.tweens.add({
      targets: deltaText,
      x: x + 40,
      y: targetY,
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
    this.inputContainer.destroy();
    this.timerBar.destroy();
    if (this.feedbackAdded) {
      this.feedbackContainer.destroy();
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