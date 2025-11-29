import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import PlayScene from './scenes/PlayScene';
import SummaryScene from './scenes/SummaryScene';
import ManagePlayersScene from './scenes/ManagePlayersScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, PlayScene, SummaryScene, ManagePlayersScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  dom: {
    createContainer: true
  }
};

new Phaser.Game(config);