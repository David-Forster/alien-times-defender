import Phaser from 'phaser';
import { getPlayerList, addPlayer, setActivePlayer } from '../utils/player';
import { MenuUIManager } from '../managers/MenuUIManager';
import { NavigationManager } from '../managers/NavigationManager';
import { DialogManager } from '../managers/DialogManager';
import { getRandomStarfieldPath } from '../utils/starfieldSelector';

export default class MenuScene extends Phaser.Scene {
   constructor() {
     super('MenuScene');
   }

   stars!: Phaser.GameObjects.Blitter;
   starfieldHeight!: number;

   preload() {
     const path = '/' + getRandomStarfieldPath();
     this.load.image('starfield', path);
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

     let dialogManager: DialogManager;

     const uiManager = new MenuUIManager(this, {
       onSetActivePlayer: (name: string) => { setActivePlayer(name); this.scene.restart(); },
       onStartGame: () => this.scene.start('PlayScene'),
       onAddPlayer: () => dialogManager.showAddPlayerDialog(
         (name: string) => {
           if (addPlayer(name)) {
             this.scene.restart();
             return true;
           } else {
             dialogManager.showError('Invalid name: empty, too long, or duplicate');
             return false;
           }
         },
         () => dialogManager.closeDialog()
       ),
       onShowAbout: () => dialogManager.showAboutDialog(() => dialogManager.closeDialog()),
       onShowManage: () => this.scene.start('ManagePlayersScene')
     });

     uiManager.createUI();

     const navigationManager = new NavigationManager(this, uiManager);
     navigationManager.setFocusableElements(uiManager.getFocusableElements());
     navigationManager.setCurrentFocusIndex(0);
     navigationManager.updateHighlight();

     dialogManager = new DialogManager(this, navigationManager);

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