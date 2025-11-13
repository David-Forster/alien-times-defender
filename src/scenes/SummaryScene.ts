import Phaser from 'phaser';

export default class SummaryScene extends Phaser.Scene {
  constructor() {
    super('SummaryScene');
  }

  create(data: { deltas: number[]; presented: Array<{ puzzle: string; rating: number; userRating: number }> }) {
    const { deltas, presented } = data;
    const netChange = deltas.reduce((sum, d) => sum + d, 0);
    let message: string;
    if (netChange < 0) {
      message = `Improvement: ${Math.abs(netChange)} points`;
    } else if (netChange > 0) {
      message = `Degradation: ${netChange} points`;
    } else {
      message = 'No change';
    }

    this.add.text(400, 100, 'Session Summary', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(400, 150, message, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

    let y = 200;
    for (let i = 0; i < presented.length; i++) {
      const p = presented[i];
      const delta = deltas[i];
      this.add.text(400, y, `${p.puzzle}: Delta ${delta}`, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
      y += 20;
    }

    const restartButton = this.add.text(400, y + 50, 'Play Again', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
    restartButton.on('pointerdown', () => {
      this.scene.start('PlayScene');
    });

    const menuButton = this.add.text(400, y + 100, 'Back to Menu', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}