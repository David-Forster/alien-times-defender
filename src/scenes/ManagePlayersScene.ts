import Phaser from 'phaser';
import { getPlayerList, renamePlayer, deletePlayer, getPlayerMastery, getPlayerHighestMastery } from '../utils/player';
import { NavigationManager, IUIManager } from '../managers/NavigationManager';
import { DialogManager } from '../managers/DialogManager';
import { getRandomStarfieldPath } from '../utils/starfieldSelector';

interface IPlayerData {
  name: string;
  currentMastery: number;
  highestMastery: number;
}

export default class ManagePlayersScene extends Phaser.Scene implements IUIManager {
  stars!: Phaser.GameObjects.Blitter;
  starfieldHeight!: number;
  scrollContainer!: Phaser.GameObjects.Container;
  sortedPlayers: IPlayerData[] = [];
  scrollOffset = 0;
  maxVisible = 6;
  buttonHeight = 70;
  containerY = 145;
  focusableElements: Array<{ obj: Phaser.GameObjects.GameObject, type: string, action: () => void, originalColor?: number | string }> = [];
  navigationManager!: NavigationManager;
  dialogManager!: DialogManager;

  constructor() {
    super('ManagePlayersScene');
  }

  preload() {
    const path = '/' + getRandomStarfieldPath();
    this.load.image('starfield', path);
  }

  create() {
    this.stars = this.add.blitter(0, 0, 'starfield');
    this.starfieldHeight = this.textures.get('starfield').getSourceImage().height;
    this.stars.create(0, 0);
    this.stars.create(0, -this.starfieldHeight);

    // Title
    this.add.text(400, 40, 'Manage Players', { fontSize: '36px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0.5);

    // Load and sort players
    this.loadAndSortPlayers();

    // Scroll container
    this.scrollContainer = this.add.container(400, this.containerY).setDepth(1);

    this.updatePlayerButtons();

    // Back button
    const backBtn = this.add.rectangle(250, 580, 120, 20, 0x333333)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MenuScene'));
    const backText = this.add.text(250, 580, 'Back', { fontSize: '16px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0.5);
    this.focusableElements.push({ obj: backBtn, type: 'back', action: () => this.scene.start('MenuScene'), originalColor: 0x333333 });

    this.navigationManager = new NavigationManager(this, this);
    this.navigationManager.setFocusableElements(this.focusableElements);
    this.navigationManager.setCurrentFocusIndex(0);

    this.dialogManager = new DialogManager(this, this.navigationManager);

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (deltaY > 0) this.scrollDown();
      else this.scrollUp();
    });
  }

  update() {
    this.stars.y += 1;
    this.stars.y %= this.starfieldHeight;
  }

  private loadAndSortPlayers() {
    const players = getPlayerList();
    this.sortedPlayers = players.map(name => ({
      name,
      currentMastery: getPlayerMastery(name).masteryScore,
      highestMastery: getPlayerHighestMastery(name)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  private updatePlayerButtons() {
    this.scrollContainer.removeAll(true);
    this.focusableElements = this.focusableElements.filter(el => el.type !== 'player' && el.type !== 'rename' && el.type !== 'delete');

    const visiblePlayers = this.sortedPlayers.slice(this.scrollOffset, this.scrollOffset + this.maxVisible);
    visiblePlayers.forEach((player, i) => {
      const y = i * this.buttonHeight;

      // Player background
      const bg = this.add.rectangle(0, y, 500, this.buttonHeight - 5, 0x333333);
      this.scrollContainer.add(bg);

      // Name
      const nameText = this.add.text(-230, y - 8, player.name, { fontSize: '18px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0, 0.5);
      this.scrollContainer.add(nameText);

      // Rename button
      const renameBtn = this.add.text(130, y, 'Rename', { fontSize: '14px', color: '#00ff00', fontFamily: 'Orbitron' })
        .setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.handleRename(player.name));
      this.scrollContainer.add(renameBtn);
      this.focusableElements.push({ obj: renameBtn, type: 'rename', action: () => this.handleRename(player.name), originalColor: '#00ff00' });

      // Delete button
      const deleteBtn = this.add.text(210, y, 'Delete', { fontSize: '14px', color: '#ff0000', fontFamily: 'Orbitron' })
        .setOrigin(0.5).setInteractive()
        .on('pointerdown', () => this.handleDelete(player.name));
      this.scrollContainer.add(deleteBtn);
      this.focusableElements.push({ obj: deleteBtn, type: 'delete', action: () => this.handleDelete(player.name), originalColor: '#ff0000' });
    });
  }

  private handleRename(name: string) {
    this.dialogManager.showRenameDialog(
      (newName: string) => {
        if (renamePlayer(name, newName)) {
          this.loadAndSortPlayers();
          this.updatePlayerButtons();
          this.navigationManager.setFocusableElements(this.focusableElements);
          return true;
        } else {
          this.dialogManager.showError('Invalid name: empty, too long, or duplicate');
          return false;
        }
      },
      () => this.dialogManager.closeDialog(),
      name
    );
  }

  private handleDelete(name: string) {
    this.dialogManager.showDeleteConfirmationDialog(
      () => {
        deletePlayer(name);
        this.loadAndSortPlayers();
        this.scrollOffset = Math.min(this.scrollOffset, Math.max(0, this.sortedPlayers.length - this.maxVisible));
        this.updatePlayerButtons();
        this.navigationManager.setFocusableElements(this.focusableElements);
        this.dialogManager.closeDialog();
      },
      () => this.dialogManager.closeDialog(),
      name
    );
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