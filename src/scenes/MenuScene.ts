import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add.text(400, 200, 'Multiplication Tables Trainer', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

    const startButton = this.add.text(400, 300, 'Start Game', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
    startButton.on('pointerdown', () => {
      this.scene.start('PlayScene');
    });

    const resetButton = this.add.text(400, 350, 'Reset Progress', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
    resetButton.on('pointerdown', () => {
      localStorage.removeItem('competencyTable');
      localStorage.removeItem('playCount');
      this.add.text(400, 400, 'Progress Reset!', { fontSize: '20px', color: '#ffff00' }).setOrigin(0.5);
    });
  }
}