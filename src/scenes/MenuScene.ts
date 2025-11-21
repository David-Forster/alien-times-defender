import Phaser from 'phaser';
import { getPlayerList, getActivePlayer, getPlayerDataKey, addPlayer, setActivePlayer } from '../utils/player';
import { calculateMastery } from '../utils/mastery';
import { initialTable } from '../constants';

export default class MenuScene extends Phaser.Scene {
   constructor() {
     super('MenuScene');
   }

   stars!: Phaser.GameObjects.Blitter;
   starfieldHeight!: number;

   preload() {
     this.load.image('starfield', '/assets/starfield.avif');
   }

   create() {
     if (getPlayerList().length === 0) {
       // Auto-create default player on first launch
       addPlayer('Player 1');
     }

     this.stars = this.add.blitter(0, 0, 'starfield');
     this.starfieldHeight = this.textures.get('starfield').getSourceImage().height ;
     console.log('starfield height is:', this.starfieldHeight)
     this.stars.create(0, 0);
     this.stars.create(0, -this.starfieldHeight);

     let focusableElements: Array<{ obj: Phaser.GameObjects.GameObject, type: string, action: () => void, originalColor?: number | string }> = [];
     let currentFocusIndex = 0;
     let dialogOpen = false;
     let dialogElements: Array<{ obj: Phaser.GameObjects.GameObject, type: string, action: () => void }> = [];
     let dialogFocusIndex = 0;

     function highlightMain(index: number) {
       focusableElements.forEach((el, i) => {
         if (el.type === 'player' || el.type === 'add') {
           const rect = el.obj as Phaser.GameObjects.Rectangle;
           rect.setFillStyle(i === index ? 0x666666 : el.originalColor as number);
         } else if (el.type === 'start') {
           const text = el.obj as Phaser.GameObjects.Text;
           text.setStyle({ backgroundColor: i === index ? '#00aa00' : el.originalColor as string });
         }
       });
     }

     function highlightDialog(index: number) {
       dialogElements.forEach((el, i) => {
         if (el.type === 'ok' || el.type === 'cancel') {
           const text = el.obj as Phaser.GameObjects.Text;
           text.setStyle({ color: i === index ? '#ffff00' : (el.type === 'ok' ? '#00ff00' : '#ff0000') });
         }
         if (el.type === 'input') {
           const inputEl = el.obj as Phaser.GameObjects.DOMElement;
           (inputEl.node as HTMLInputElement).style.border = i === index ? '2px solid yellow' : '1px solid #ccc';
         }
       });
     }

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

         focusableElements.push({ obj: bg, type: 'player', action: () => { setActivePlayer(name); this.scene.restart(); }, originalColor: name === activePlayer ? 0x00aa00 : 0x333333 });

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

       focusableElements.push({ obj: addBtn, type: 'add', action: () => showAddPlayerDialog(), originalColor: 0x0066cc });
     };

     updatePlayerButtons();

     let modal: Phaser.GameObjects.Rectangle;
     let input: Phaser.GameObjects.DOMElement;
     let confirmBtn: Phaser.GameObjects.Text;
     let cancelBtn: Phaser.GameObjects.Text;
     let titleText: Phaser.GameObjects.Text;

     const closeDialog = () => {
       modal.destroy();
       input.destroy();
       confirmBtn.destroy();
       cancelBtn.destroy();
       titleText.destroy();
       dialogOpen = false;
       dialogElements = [];
     };

     // Add Player Dialog
     const showAddPlayerDialog = () => {
       dialogOpen = true;
       modal = this.add.rectangle(400, 300, 400, 200, 0x000000, 0.8).setDepth(10).setInteractive();
       titleText = this.add.text(400, 220, 'Enter Player Name', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5).setDepth(11);

       input = this.add.dom(400, 280, 'input', {
         type: 'text',
         placeholder: 'Name (max 20 chars)',
         maxLength: 20,
         style: 'width: 300px; font-size: 18px; padding: 8px; text-align: center;'
       }).setDepth(11);

       confirmBtn = this.add.text(340, 340, 'OK', { fontSize: '20px', color: '#00ff00' })
         .setOrigin(0.5).setInteractive().setDepth(11)
         .on('pointerdown', () => {
           const name = (input.node as HTMLInputElement).value.trim();
           if (addPlayer(name)) {
             closeDialog();
             this.scene.restart();
           } else {
             this.add.text(400, 370, 'Invalid or duplicate name!', { fontSize: '16px', color: '#ff0000' })
               .setOrigin(0.5).setDepth(11);
           }
         });

       cancelBtn = this.add.text(460, 340, 'Cancel', { fontSize: '20px', color: '#ff0000' })
         .setOrigin(0.5).setInteractive().setDepth(11)
         .on('pointerdown', () => closeDialog());

       dialogElements = [
         { obj: input, type: 'input', action: () => {} },
         { obj: confirmBtn, type: 'ok', action: () => {
           const name = (input.node as HTMLInputElement).value.trim();
           if (addPlayer(name)) {
             closeDialog();
             this.scene.restart();
           } else {
             this.add.text(400, 370, 'Invalid or duplicate name!', { fontSize: '16px', color: '#ff0000' }).setOrigin(0.5).setDepth(11);
           }
         }},
         { obj: cancelBtn, type: 'cancel', action: () => closeDialog() }
       ];

       dialogFocusIndex = 0;
       (input.node as HTMLInputElement).focus();
       highlightDialog(dialogFocusIndex);

       (input.node as HTMLInputElement).addEventListener('keydown', (e) => {
         if (e.key === 'Enter') {
           dialogElements[1].action();
         } else if (e.key === 'Escape') {
           closeDialog();
         } else if (e.key === 'Tab') {
           e.preventDefault();
           dialogFocusIndex = (dialogFocusIndex + 1) % dialogElements.length;
           highlightDialog(dialogFocusIndex);
           if (dialogElements[dialogFocusIndex].type === 'input') {
             (input.node as HTMLInputElement).focus();
           }
         }
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

       focusableElements.push({ obj: startButton, type: 'start', action: () => this.scene.start('PlayScene'), originalColor: '#006600' });
     } else {
       this.add.text(400, 500, 'Create or select a player to begin', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5);
     }

     highlightMain(currentFocusIndex);

     this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
       if (dialogOpen) {
         if (event.key === 'Tab') {
           event.preventDefault();
           if (event.shiftKey) {
             dialogFocusIndex = (dialogFocusIndex - 1 + dialogElements.length) % dialogElements.length;
           } else {
             dialogFocusIndex = (dialogFocusIndex + 1) % dialogElements.length;
           }
           highlightDialog(dialogFocusIndex);
           if (dialogElements[dialogFocusIndex].type === 'input') {
             ((dialogElements[dialogFocusIndex].obj as Phaser.GameObjects.DOMElement).node as HTMLInputElement).focus();
           }
         } else if (event.key === 'ArrowDown') {
           dialogFocusIndex = (dialogFocusIndex + 1) % dialogElements.length;
           highlightDialog(dialogFocusIndex);
           if (dialogElements[dialogFocusIndex].type === 'input') {
             ((dialogElements[dialogFocusIndex].obj as Phaser.GameObjects.DOMElement).node as HTMLInputElement).focus();
           }
         } else if (event.key === 'ArrowUp') {
           dialogFocusIndex = (dialogFocusIndex - 1 + dialogElements.length) % dialogElements.length;
           highlightDialog(dialogFocusIndex);
           if (dialogElements[dialogFocusIndex].type === 'input') {
             ((dialogElements[dialogFocusIndex].obj as Phaser.GameObjects.DOMElement).node as HTMLInputElement).focus();
           }
         } else if (event.key === 'Enter') {
           if (dialogElements[dialogFocusIndex].type !== 'input') {
             dialogElements[dialogFocusIndex].action();
           }
         } else if (event.key === 'Escape') {
           closeDialog();
         }
       } else {
         if (event.key === 'Tab') {
           event.preventDefault();
           if (event.shiftKey) {
             currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
           } else {
             currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
           }
           highlightMain(currentFocusIndex);
         } else if (event.key === 'ArrowDown') {
           currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
           highlightMain(currentFocusIndex);
         } else if (event.key === 'ArrowUp') {
           currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
           highlightMain(currentFocusIndex);
         } else if (event.key === 'Enter') {
           focusableElements[currentFocusIndex].action();
         }
       }
     });
   }
    update() {
      this.stars.y += 1;
      this.stars.y %= this.starfieldHeight;
    }
}