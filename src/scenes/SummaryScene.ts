import Phaser from 'phaser';

export default class SummaryScene extends Phaser.Scene {
  constructor() {
    super('SummaryScene');
  }

  create(data: { deltas: number[]; presented: Array<{ puzzle: string; rating: number; userRating: number }>; times: number[]; correctness: boolean[] }) {
    const { deltas, presented, times, correctness } = data;
    const netChange = deltas.reduce((sum, d) => sum + d, 0);
    const displayChange = -netChange;
    const accuracy = correctness.filter(c => c).length / correctness.length;
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

    this.add.text(400, 100, 'Session Summary', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

    // Progress bar for rating change
    const barY = 200;
    const barCenterX = 400;
    const barWidth = 400;
    const barHeight = 20;
    const maxChange = 100;
    const changeRatio = Math.min(Math.abs(displayChange) / maxChange, 1);
    const fgWidth = changeRatio * (barWidth / 2);
    const fgX = displayChange >= 0 ? barCenterX + fgWidth / 2 : barCenterX - fgWidth / 2;
    const fgColor = displayChange >= 0 ? 0x00ff00 : 0xff0000;

    this.add.rectangle(barCenterX, barY, barWidth, barHeight, 0x666666);
    if (displayChange !== 0) {
      this.add.rectangle(fgX, barY, fgWidth, barHeight, fgColor);
    }
    this.add.text(barCenterX, barY - 30, 'Rating Change', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(barCenterX, barY + 30, `${displayChange > 0 ? '+' : ''}${displayChange} points`, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);

    // Stats panel
    this.add.text(400, 300, `Accuracy: ${(accuracy * 100).toFixed(1)}%`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(400, 330, `Average Time: ${avgTime.toFixed(1)}s`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(400, 360, `Rating Change: ${displayChange > 0 ? '+' : ''}${displayChange} points`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

    const restartButton = this.add.text(400, 450, 'Play Again', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
    restartButton.on('pointerdown', () => {
      this.scene.start('PlayScene');
    });

    const menuButton = this.add.text(400, 480, 'Back to Menu', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}