import Phaser from 'phaser';
import { calculateMastery } from '../utils/mastery';

export default class SummaryScene extends Phaser.Scene {
   constructor() {
     super('SummaryScene');
   }

   create(data: { deltas: number[]; presented: Array<{ puzzle: string; rating: number; userRating: number }>; times: number[]; correctness: boolean[] }) {
     const { deltas, presented, times, correctness } = data;
     const accuracy = correctness.filter(c => c).length / correctness.length;
     const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

     this.add.text(400, 100, 'Session Summary', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

     // Load full table and history
     const table = JSON.parse(localStorage.getItem('competencyTable')!);
     const history = JSON.parse(localStorage.getItem('answerHistory') || '[]');

     // Simulate "before" state
     const oldTable = JSON.parse(JSON.stringify(table));
     data.deltas.forEach((d, i) => {
       const puzzle = data.presented[i].puzzle;
       const entry = oldTable.find((e: any) => e.puzzle === puzzle);
       if (entry) entry.userRating -= d; // reverse delta
     });

     const oldMastery = calculateMastery(oldTable, history.slice(0, -data.times.length));
     const newMastery = calculateMastery(table, history);

     const masteryDelta = newMastery.masteryScore - oldMastery.masteryScore;

     // Mastery Progress Bar
     const masteryY = 200;
     this.add.text(400, masteryY - 40, 'Mastery Progress', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
     this.add.rectangle(400, masteryY, 400, 20, 0x666666).setOrigin(0.5);
     this.add.rectangle(200 + (newMastery.masteryScore / 100) * 200, masteryY, 4, 20, 0x00ffff).setOrigin(0.5);
     this.add.text(400, masteryY + 30, `${newMastery.masteryScore}% (${masteryDelta > 0 ? '+' : ''}${masteryDelta.toFixed(1)})`, {
       fontSize: '16px', color: masteryDelta > 0 ? '#00ff00' : '#ff0000'
     }).setOrigin(0.5);

     // Stats panel
     this.add.text(400, 300, `Accuracy: ${(accuracy * 100).toFixed(1)}%`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
     this.add.text(400, 330, `Average Time: ${avgTime.toFixed(1)}s`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

     const restartButton = this.add.text(400, 400, 'Play Again', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
     restartButton.on('pointerdown', () => {
       this.scene.start('PlayScene');
     });

     const menuButton = this.add.text(400, 430, 'Back to Menu', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
     menuButton.on('pointerdown', () => {
       this.scene.start('MenuScene');
     });
   }
}