import Phaser from 'phaser';
import { getPlayerList, getActivePlayer, getPlayerDataKey, addPlayer, setActivePlayer } from '../utils/player';
import { calculateMastery } from '../utils/mastery';
import { initialTable } from '../constants';

export default class MenuScene extends Phaser.Scene {
   constructor() {
     super('MenuScene');
   }

   stars!: Phaser.GameObjects.Blitter;

   preload() {
     this.load.image('starfield', 'src/assets/starfield.png');
   }

   create() {
     if (getPlayerList().length === 0) {
       // Auto-create default player on first launch
       addPlayer('Player 1');
     }

     this.stars = this.add.blitter(0, 0, 'starfield');
     this.stars.create(0, 0);
     this.stars.create(512, 0);
     this.stars.create(0, -512);
     this.stars.create(512, -512);

     this.add.text(400, 100, 'Multiplication Tables Trainer', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5);

     const players = getPlayerList();
     const activePlayer = getActivePlayer();

     console.debug(`players:${players}, activePlayer:${activePlayer}`)

     // Title
     this.add.text(400, 160, 'Select Player', { fontSize: '24px', color: '#ffff00' }).setOrigin(0.5);

     const containerY = 220;
     const buttonHeight = 50;
     const maxVisible = 5;
     const scrollContainer = this.add.container(400, containerY).setDepth(1);

     // Player Buttons
     const updatePlayerButtons = () => {
       scrollContainer.removeAll(true);
       players.forEach((name, i) => {
         const y = i * buttonHeight;
         const bg = this.add.rectangle(0, y, 500, buttonHeight - 5, name === activePlayer ? 0x00aa00 : 0x333333)
           .setInteractive()
           .on('pointerdown', () => {
             setActivePlayer(name);
             this.scene.restart();
           });

         scrollContainer.add(bg);

         const nameText = this.add.text(-230, y, name, { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
         scrollContainer.add(nameText);
         if (name === activePlayer) {
           const checkText = this.add.text(230, y, '✓', { fontSize: '20px', color: '#00ff00' }).setOrigin(1, 0.5);
           scrollContainer.add(checkText);
         }
       });

       // Add New Player Button
       const addY = players.length * buttonHeight + 20;
       const addBtn = this.add.rectangle(0, addY, 500, buttonHeight - 5, 0x0066cc)
         .setInteractive()
         .on('pointerdown', () => showAddPlayerDialog());
       const addText = this.add.text(0, addY, '+ Add New Player', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
       scrollContainer.add(addBtn);
       scrollContainer.add(addText);
     };

     updatePlayerButtons();

     // Add Player Dialog
     const showAddPlayerDialog = () => {
       const modal = this.add.rectangle(400, 300, 400, 200, 0x000000, 0.8).setDepth(10).setInteractive();
       const title = this.add.text(400, 220, 'Enter Player Name', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setDepth(11);

       const input = this.add.dom(400, 280, 'input', {
         type: 'text',
         placeholder: 'Name (max 20 chars)',
         maxLength: 20,
         style: 'width: 300px; font-size: 18px; padding: 8px; text-align: center;'
       }).setDepth(11);

       const confirmBtn = this.add.text(340, 340, 'OK', { fontSize: '20px', color: '#00ff00' })
         .setOrigin(0.5).setInteractive().setDepth(11)
         .on('pointerdown', () => {
           const name = (input.node as HTMLInputElement).value.trim();
           if (addPlayer(name)) {
             modal.destroy(); input.destroy(); confirmBtn.destroy(); cancelBtn.destroy(); title.destroy();
             this.scene.restart();
           } else {
             this.add.text(400, 370, 'Invalid or duplicate name!', { fontSize: '16px', color: '#ff0000' })
               .setOrigin(0.5).setDepth(11);
           }
         });

       const cancelBtn = this.add.text(460, 340, 'Cancel', { fontSize: '20px', color: '#ff0000' })
         .setOrigin(0.5).setInteractive().setDepth(11)
         .on('pointerdown', () => {
           modal.destroy(); input.destroy(); confirmBtn.destroy(); cancelBtn.destroy(); title.destroy();
         });
     };

     // Show stats only if player selected
     if (activePlayer) {
       const table = JSON.parse(localStorage.getItem(getPlayerDataKey('competencyTable'))!);
       const history = JSON.parse(localStorage.getItem(getPlayerDataKey('answerHistory')) || '[]');
       const mastery = calculateMastery(table, history);

       this.add.text(400, 480, `Player: ${activePlayer}`, { fontSize: '18px', color: '#00ffff' }).setOrigin(0.5);
       this.add.text(400, 505, `Mastery: ${mastery.masteryScore}%`, {
         fontSize: '20px', color: mastery.masteryScore >= 90 ? '#00ff00' : '#ffff00'
       }).setOrigin(0.5);

       const startButton = this.add.text(400, 550, 'Start Game', { fontSize: '28px', color: '#ffffff', backgroundColor: '#006600', padding: { x: 20, y: 10 } })
         .setOrigin(0.5).setInteractive()
         .on('pointerover', () => startButton.setStyle({ backgroundColor: '#00aa00' }))
         .on('pointerout', () => startButton.setStyle({ backgroundColor: '#006600' }))
         .on('pointerdown', () => {
           this.scene.start('PlayScene');
         });
     } else {
       this.add.text(400, 500, 'Create or select a player to begin', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5);
     }
   }
    update() {
      this.stars.y += 1;
      this.stars.y %= 512;
    }
}