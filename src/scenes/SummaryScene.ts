import Phaser from 'phaser';
import { calculateMastery } from '../utils/mastery';
import { getPlayerDataKey, getActivePlayer } from '../utils/player';

export default class SummaryScene extends Phaser.Scene {
   constructor() {
     super('SummaryScene');
   }

   stars!: Phaser.GameObjects.Blitter;
   starfieldHeight!: number;

   preload() {
     this.load.image('starfield', '/assets/starfield.avif');
   }

   create(data: { deltas: number[]; presented: Array<{ puzzle: string; rating: number; userRating: number }>; times: number[]; correctness: boolean[] }) {
     const { deltas, presented, times, correctness } = data;


     this.stars = this.add.blitter(0, 0, 'starfield');
     this.starfieldHeight = this.textures.get('starfield').getSourceImage().height;
     this.stars.create(0, 0);
     this.stars.create(0, -this.starfieldHeight);
     
     this.add.text(400, 60, 'Session Summary', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
     this.add.text(400, 100, `for ${getActivePlayer()}`, { fontSize: '20px', color: '#00ffff' }).setOrigin(0.5);
     
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

     // Track highest mastery
     const currentHighest = parseFloat(localStorage.getItem(getPlayerDataKey('highestMastery')) || '0');
     if (newMastery.masteryScore > currentHighest) {
       localStorage.setItem(getPlayerDataKey('highestMastery'), newMastery.masteryScore.toString());
     }

     const highestMastery = Math.max(currentHighest, newMastery.masteryScore);

     const masteryDelta = newMastery.masteryScore - oldMastery.masteryScore;
     
     // console log all key mastery metrics
     console.log(`highestMastery:${highestMastery}, newMastry:${newMastery.masteryScore}`)
     

     // Mastery Progress Bar
     const masteryY = 200;
     const masteryDeltaLabel = masteryDelta == 0 ? 'no change from previous session'
      : masteryDelta > 0 ? `up ${masteryDelta.toFixed(0)}% from previous session`
      : `down ${Math.abs(masteryDelta).toFixed(0)}% from previous session`;
     this.add.text(400, masteryY - 40, 'Mastery Progress', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
     this.add.rectangle(400, masteryY, 400, 20, 0x666666).setOrigin(0.5);
     this.add.rectangle(200 + (newMastery.masteryScore / 100) * 200, masteryY, (newMastery.masteryScore / 100) * 400, 20, 0x00ffff).setOrigin(0.5);
     const percentageText = `${newMastery.masteryScore.toFixed(1)}%`;
     const textX = 200 + (newMastery.masteryScore / 100) * 400 - 10;
     this.add.text(textX, masteryY, percentageText, { fontSize: '16px', color: '#000000' }).setOrigin(1, 0.5);
     this.add.text(400, masteryY + 30, masteryDeltaLabel, {
       fontSize: '14px', color: masteryDelta == 0 ? '#ffffff' : masteryDelta > 0 ? '#00ff00' : '#ff0000'
     }).setOrigin(0.5);
     this.add.rectangle(200 + (highestMastery / 100) * 400, masteryY, 2, 22, 0x0080ff).setOrigin(0.5);

     // Add label for highest mastery
     const lineX = 200 + (highestMastery / 100) * 400;
     let labelX = lineX;
     if (highestMastery > 80) labelX -= 50;
     const labelY = masteryY - 20;
     const labelText = `Highest: ${highestMastery.toFixed(1)}%`;
     const label = this.add.text(labelX, labelY, labelText, { fontSize: '14px', color: '#0080ff' }).setOrigin(0.5);
     const bg = this.add.rectangle(labelX, labelY, label.width + 10, label.height + 4, 0x000000, 0.5).setOrigin(0.5);
     bg.setDepth(label.depth - 1);

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
           graphics.fillCircle(lineX, chartBottom + 20, 4);
         }
       });
       // Vertical dashed line at beginning of multiplier group
       graphics.lineStyle(1, 0xffffff, 0.5);
       for (let yy = chartY; yy < chartBottom; yy += 6) {
         graphics.beginPath();
         graphics.moveTo(startX, yy);
         graphics.lineTo(startX, Math.min(yy + 3, chartBottom));
         graphics.strokePath();
       }
       // Label multiplier
       this.add.text(x, 360, multiplier + 'x', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
     });

     const restartButton = this.add.text(400, 460, 'Play Again', { fontSize: '24px', color: '#ffffff', backgroundColor: '#006600', padding: { x: 20, y: 10 } })
       .setOrigin(0.5).setInteractive()
       .on('pointerover', () => restartButton.setStyle({ backgroundColor: '#00aa00' }))
       .on('pointerout', () => restartButton.setStyle({ backgroundColor: '#006600' }))
       .on('pointerdown', () => {
         this.scene.start('PlayScene');
       });

     const menuButton = this.add.text(400, 520, 'Back to Menu', { fontSize: '24px', color: '#ffffff', backgroundColor: '#006600', padding: { x: 20, y: 10 } })
       .setOrigin(0.5).setInteractive()
       .on('pointerover', () => menuButton.setStyle({ backgroundColor: '#00aa00' }))
       .on('pointerout', () => menuButton.setStyle({ backgroundColor: '#006600' }))
       .on('pointerdown', () => {
         this.scene.start('MenuScene');
       });

     let focusableElements: Array<{ obj: Phaser.GameObjects.GameObject, type: string, action: () => void, originalColor: string }> = [
       { obj: restartButton, type: 'button', action: () => this.scene.start('PlayScene'), originalColor: '#006600' },
       { obj: menuButton, type: 'button', action: () => this.scene.start('MenuScene'), originalColor: '#006600' }
     ];
     let currentFocusIndex = 0;

     function highlight(index: number) {
       focusableElements.forEach((el, i) => {
         const text = el.obj as Phaser.GameObjects.Text;
         text.setStyle({ backgroundColor: i === index ? '#00aa00' : el.originalColor });
       });
     }

     highlight(currentFocusIndex);

     this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
       if (event.key === 'Tab') {
         event.preventDefault();
         if (event.shiftKey) {
           currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
         } else {
           currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
         }
         highlight(currentFocusIndex);
       } else if (event.key === 'ArrowDown') {
         currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
         highlight(currentFocusIndex);
       } else if (event.key === 'ArrowUp') {
         currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
         highlight(currentFocusIndex);
       } else if (event.key === 'Enter') {
         focusableElements[currentFocusIndex].action();
       }
     });
   }
    update() {
      this.stars.y += 1;
      this.stars.y %= this.starfieldHeight;
    }
}