import Phaser from 'phaser';
import { calculateMastery } from '../utils/mastery';
import { initialTable } from '../constants';

export default class MenuScene extends Phaser.Scene {
   constructor() {
     super('MenuScene');
   }

   create() {
     this.add.text(400, 200, 'Multiplication Tables Trainer', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

     const table = localStorage.getItem('competencyTable')
       ? JSON.parse(localStorage.getItem('competencyTable')!)
       : initialTable;
     const history = JSON.parse(localStorage.getItem('answerHistory') || '[]');
     const mastery = calculateMastery(table, history);

     this.add.text(400, 450, `Mastery: ${mastery.masteryScore}%`, {
       fontSize: '20px', color: mastery.masteryScore >= 90 ? '#00ff00' : '#ffff00'
     }).setOrigin(0.5);

     this.add.text(400, 475, `${mastery.puzzlesAtMastery}/${mastery.totalPuzzles} mastered`, {
       fontSize: '16px', color: '#aaaaaa'
     }).setOrigin(0.5);

     const startButton = this.add.text(400, 300, 'Start Game', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
     startButton.on('pointerdown', () => {
       this.scene.start('PlayScene');
     });

     const resetButton = this.add.text(400, 350, 'Reset Progress', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive();
     resetButton.on('pointerdown', () => {
       localStorage.removeItem('competencyTable');
       localStorage.removeItem('playCount');
       localStorage.removeItem('answerHistory');
       this.add.text(400, 400, 'Progress Reset!', { fontSize: '20px', color: '#ffff00' }).setOrigin(0.5);
     });
   }
}