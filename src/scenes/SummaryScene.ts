import Phaser from 'phaser';
import { calculateMastery } from '../utils/mastery';
import { getPlayerDataKey, getActivePlayer } from '../utils/player';

export default class SummaryScene extends Phaser.Scene {
   constructor() {
     super('SummaryScene');
   }

   create(data: { deltas: number[]; presented: Array<{ puzzle: string; rating: number; userRating: number }>; times: number[]; correctness: boolean[] }) {
     const { deltas, presented, times, correctness } = data;
     const accuracy = correctness.filter(c => c).length / correctness.length;
     const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

     this.add.text(400, 60, `Summary for ${getActivePlayer()}`, { fontSize: '20px', color: '#00ffff' }).setOrigin(0.5);
     this.add.text(400, 100, 'Session Summary', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

     // Load full table and history
     const table = JSON.parse(localStorage.getItem(getPlayerDataKey('competencyTable'))!);
     const history = JSON.parse(localStorage.getItem(getPlayerDataKey('answerHistory')) || '[]');

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
     this.add.text(400, masteryY + 30, `${newMastery.masteryScore.toFixed(1)}% (${masteryDelta > 0 ? '+' : ''}${masteryDelta.toFixed(1)})`, {
       fontSize: '16px', color: masteryDelta > 0 ? '#00ff00' : '#ff0000'
     }).setOrigin(0.5);

     // Group all puzzles by multiplier
     const groups: { [key: number]: typeof table } = {};
     for (const p of table) {
       const b = parseInt(p.puzzle.split(' x ')[0]);
       if (!groups[b]) groups[b] = [];
       groups[b].push(p);
     }
     // Sort each group's elements from lowest to highest (by the second number)
     for (const mult in groups) {
       groups[mult].sort((a, b) => {
         const aNum = parseInt(a.puzzle.split(' x ')[1]);
         const bNum = parseInt(b.puzzle.split(' x ')[1]);
         return aNum - bNum;
       });
     }
     const multipliers = Object.keys(groups).map(Number).sort((a, b) => a - b);
     console.log('multipliers', multipliers)
     console.log('groups', groups)

     // Chart dimensions
     const chartY = 250;
     const chartHeight = 100;
     const chartBottom = chartY + chartHeight;
     const chartLeft = 50;
     const chartWidth = 700;
     const chartRight = chartLeft + chartWidth;
     const minMult = multipliers[0];
     const maxMult = multipliers[multipliers.length - 1];
     const multRange = maxMult - minMult || 1;

     // Draw chart
     const graphics = this.add.graphics();
     multipliers.forEach(multiplier => {
       const x = chartLeft + ((multiplier - minMult) / multRange) * chartWidth;
       const puzzles = groups[multiplier];
       const num = puzzles.length;
       const spacing = num > 1 ? 8 : 0; // pixels between lines if multiple
       const startX = x - (num - 1) * spacing / 2;
       puzzles.forEach((p, i) => {
         const lineX = startX + i * spacing;
         const height = (p.userRating / 100) * chartHeight;
         // Color: closer to 1 (low userRating) greener, high redder
         const ratio = (p.userRating - 1) / 99; // 0 to 1
         const r = Math.round(255 * ratio);
         const g = Math.round(255 * (1 - ratio));
         const color = (r << 16) | (g << 8) | 0;
         graphics.lineStyle(2, color);
         graphics.beginPath();
         graphics.moveTo(lineX, chartBottom);
         graphics.lineTo(lineX, chartBottom - height);
         graphics.strokePath();
         // If tested in session, add a dot below
         const presentedIndex = presented.findIndex(pr => pr.puzzle === p.puzzle);
         if (presentedIndex !== -1) {
           const isCorrect = correctness[presentedIndex];
           const circleColor = isCorrect ? 0x00ff00 : 0xff0000;
           graphics.fillStyle(circleColor);
           graphics.fillCircle(lineX, chartBottom + 8, 4);
         }
       });
       // Label multiplier
       this.add.text(x, 265, multiplier + 'x', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
     });

     // Stats panel
     this.add.text(400, 380, `Accuracy: ${(accuracy * 100).toFixed(1)}%`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
     this.add.text(400, 410, `Average Time: ${avgTime.toFixed(1)}s`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

     const restartButton = this.add.text(400, 460, 'Play Again', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
     restartButton.on('pointerdown', () => {
       this.scene.start('PlayScene');
     });

     const menuButton = this.add.text(400, 490, 'Back to Menu', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
     menuButton.on('pointerdown', () => {
       this.scene.start('MenuScene');
     });
   }
}