import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import PlayScene from './scenes/PlayScene';
import SummaryScene from './scenes/SummaryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  scene: [MenuScene, PlayScene, SummaryScene],
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