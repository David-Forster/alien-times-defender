import Phaser from 'phaser';
import { getPlayerList, addPlayer, setActivePlayer } from '../utils/player';
import { MenuUIManager } from '../managers/MenuUIManager';
import { NavigationManager } from '../managers/NavigationManager';
import { DialogManager } from '../managers/DialogManager';

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
     this.starfieldHeight = this.textures.get('starfield').getSourceImage().height;
     console.log('starfield height is:', this.starfieldHeight);
     this.stars.create(0, 0);
     this.stars.create(0, -this.starfieldHeight);

     const uiManager = new MenuUIManager(this, {
       onSetActivePlayer: (name: string) => { setActivePlayer(name); this.scene.restart(); },
       onStartGame: () => this.scene.start('PlayScene'),
       onAddPlayer: () => dialogManager.showAddPlayerDialog(
         (name: string) => {
           if (addPlayer(name)) {
             dialogManager.closeDialog();
             this.scene.restart();
           } else {
             // Error handling: could add a message, but for simplicity, just close
             dialogManager.closeDialog();
           }
         },
         () => dialogManager.closeDialog()
       )
     });

     uiManager.createUI();

     const navigationManager = new NavigationManager(this, uiManager);
     navigationManager.setFocusableElements(uiManager.getFocusableElements());
     navigationManager.setCurrentFocusIndex(0);
     navigationManager.updateHighlight();

     const dialogManager = new DialogManager(this, navigationManager);

     this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
       if (deltaY > 0) uiManager.scrollDown();
       else uiManager.scrollUp();
     });
   }
    update() {
      this.stars.y += 1;
      this.stars.y %= this.starfieldHeight;
    }
}