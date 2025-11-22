import Phaser from 'phaser';
import { getPlayerList, getActivePlayer } from '../utils/player';
import { calculateMastery } from '../utils/mastery';
import { IUIManager } from './NavigationManager';

export interface IPlayerData {
  name: string;
  currentMastery: number;
  highestMastery: number;
}

export class MenuUIManager implements IUIManager {
  private scene: Phaser.Scene;
  private onSetActivePlayer: (name: string) => void;
  private onStartGame: () => void;
  private onAddPlayer: () => void;
  private focusableElements: Array<{ obj: Phaser.GameObjects.GameObject, type: string, action: () => void, originalColor?: number | string }> = [];
  private scrollContainer: Phaser.GameObjects.Container;
  private sortedPlayers: IPlayerData[] = [];
  private scrollOffset = 0;
  private maxVisible = 5;
  private buttonHeight = 70;
  private containerY = 145;

  constructor(scene: Phaser.Scene, callbacks: { onSetActivePlayer: (name: string) => void; onStartGame: () => void; onAddPlayer: () => void }) {
    this.scene = scene;
    this.onSetActivePlayer = callbacks.onSetActivePlayer;
    this.onStartGame = callbacks.onStartGame;
    this.onAddPlayer = callbacks.onAddPlayer;
  }

  createUI() {
    // Load and sort players
    this.loadAndSortPlayers();

    // Title
    this.scene.add.text(270, 25, 'Alien', { fontSize: '36px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0.5);
    this.scene.add.text(365, 20, '×', { fontSize: '100px', color: '#ff0000', fontFamily: 'Orbitron' }).setOrigin(0.5);
    this.scene.add.text(500, 25, 'Defender', { fontSize: '36px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0.5);

    // Leaderboard title
    this.scene.add.text(400, 85, 'Leaderboard', { fontSize: '24px', color: '#ffff00', fontFamily: 'Orbitron' }).setOrigin(0.5);

    // Scroll container
    this.scrollContainer = this.scene.add.container(400, this.containerY).setDepth(1);

    this.updatePlayerButtons();

    // Scroll to active player
    const currentActivePlayer = getActivePlayer();
    if (currentActivePlayer) {
      const index = this.sortedPlayers.findIndex(p => p.name === currentActivePlayer);
      if (index >= 0) {
        this.scrollOffset = Math.max(0, Math.min(index - 2, this.sortedPlayers.length - this.maxVisible));
        this.updatePlayerButtons();
      }
    }

    // Add button
    const addBtn = this.scene.add.rectangle(250, 525, 200, 50, 0x0066cc)
      .setInteractive()
      .on('pointerdown', () => this.onAddPlayer());
    const addText = this.scene.add.text(250, 525, '+ Add New Player', { fontSize: '20px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0.5);
    this.focusableElements.push({ obj: addBtn, type: 'add', action: () => this.onAddPlayer(), originalColor: 0x0066cc });

    // Stats and start button if active player
    const activePlayer = getActivePlayer();
    if (activePlayer) {
      const table = JSON.parse(localStorage.getItem(`player_${activePlayer}_competencyTable`)!);
      const history = JSON.parse(localStorage.getItem(`player_${activePlayer}_answerHistory`) || '[]');
      const mastery = calculateMastery(table, history);

      this.scene.add.text(400, 405, `Player: ${activePlayer}`, { fontSize: '18px', color: '#00ffff', fontFamily: 'Orbitron' }).setOrigin(0.5);
      this.scene.add.text(400, 430, `Mastery: ${mastery.masteryScore}%`, {
        fontSize: '20px', color: mastery.masteryScore >= 90 ? '#00ff00' : '#ffff00', fontFamily: 'Orbitron'
      }).setOrigin(0.5);

      const startButton = this.scene.add.text(550, 525, 'Start Game', { fontSize: '28px', color: '#ffffff', backgroundColor: '#006600', padding: { x: 20, y: 10 }, fontFamily: 'Orbitron' })
        .setOrigin(0.5).setInteractive()
        .on('pointerover', () => startButton.setStyle({ backgroundColor: '#00aa00' }))
        .on('pointerout', () => startButton.setStyle({ backgroundColor: '#006600' }))
        .on('pointerdown', () => this.onStartGame());

      this.focusableElements.push({ obj: startButton, type: 'start', action: () => this.onStartGame(), originalColor: '#006600' });
    } else {
      this.scene.add.text(400, 425, 'Create or select a player to begin', { fontSize: '18px', color: '#aaaaaa', fontFamily: 'Orbitron' }).setOrigin(0.5);
    }
  }

  private loadAndSortPlayers() {
    const players = getPlayerList();
    this.sortedPlayers = players.map(name => {
      const competencyKey = `player_${name}_competencyTable`;
      const historyKey = `player_${name}_answerHistory`;
      const highestKey = `player_${name}_highestMastery`;

      const competencies = JSON.parse(localStorage.getItem(competencyKey) || '[]');
      const answerHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const highestMastery = parseInt(localStorage.getItem(highestKey) || '0');

      const mastery = competencies.length > 0 ? calculateMastery(competencies, answerHistory) : { masteryScore: 0 };
      return { name, currentMastery: mastery.masteryScore, highestMastery };
    }).sort((a, b) => b.currentMastery - a.currentMastery);
  }

  private updatePlayerButtons() {
    this.scrollContainer.removeAll(true);
    this.focusableElements = this.focusableElements.filter(el => el.type !== 'player');

    const activePlayer = getActivePlayer();
    const visiblePlayers = this.sortedPlayers.slice(this.scrollOffset, this.scrollOffset + this.maxVisible);
    visiblePlayers.forEach((player, i) => {
      const y = i * this.buttonHeight;
      const bg = this.scene.add.rectangle(0, y, 500, this.buttonHeight - 5, player.name === activePlayer ? 0x00aa00 : 0x333333)
        .setInteractive()
        .on('pointerdown', () => this.onSetActivePlayer(player.name));

      this.scrollContainer.add(bg);

      this.focusableElements.push({ obj: bg, type: 'player', action: () => this.onSetActivePlayer(player.name), originalColor: player.name === activePlayer ? 0x00aa00 : 0x333333 });

      const nameText = this.scene.add.text(-230, y-8, player.name, { fontSize: '18px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0, 0.5);
      this.scrollContainer.add(nameText);

      const currentText = this.scene.add.text(20, y-8, `Mastery Rank: ${player.currentMastery}%`, { fontSize: '16px', fontStyle: 'bold', color: '#ffff00', fontFamily: 'Orbitron' }).setOrigin(0, 0.5);
      this.scrollContainer.add(currentText);

      const highestText = this.scene.add.text(20, y +7, `Highest: ${player.highestMastery}%`, { fontSize: '12px', color: '#cccccc', fontFamily: 'Orbitron' }).setOrigin(0, 0.5);
      this.scrollContainer.add(highestText);

      if (player.name === activePlayer) {
        const checkText = this.scene.add.text(230, y-8, '✓', { fontSize: '20px', color: '#00ff00', fontFamily: 'Orbitron' }).setOrigin(1, 0.5);
        this.scrollContainer.add(checkText);
      }
    });
  }

  scrollUp() {
    if (this.scrollOffset > 0) {
      this.scrollOffset--;
      this.updatePlayerButtons();
    }
  }

  scrollDown() {
    if (this.scrollOffset < this.sortedPlayers.length - this.maxVisible) {
      this.scrollOffset++;
      this.updatePlayerButtons();
    }
  }

  pageUp() {
    this.scrollOffset = Math.max(0, this.scrollOffset - this.maxVisible);
    this.updatePlayerButtons();
  }

  pageDown() {
    this.scrollOffset = Math.min(Math.max(0, this.sortedPlayers.length - this.maxVisible), this.scrollOffset + this.maxVisible);
    this.updatePlayerButtons();
  }

  getFocusableElements() {
    return this.focusableElements;
  }

  getPlayerCount(): number {
    return this.sortedPlayers.slice(this.scrollOffset, this.scrollOffset + this.maxVisible).length;
  }

  getMaxVisible(): number {
    return this.maxVisible;
  }

  getScrollOffset(): number {
    return this.scrollOffset;
  }

  setScrollOffset(offset: number): void {
    this.scrollOffset = offset;
    this.updatePlayerButtons();
  }

  updateButtons(): void {
    this.updatePlayerButtons();
  }
}