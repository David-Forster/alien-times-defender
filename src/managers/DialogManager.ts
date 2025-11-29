import Phaser from 'phaser';
import { NavigationManager } from './NavigationManager';

export interface IDialogElement {
  obj: Phaser.GameObjects.GameObject;
  type: string;
  action: () => void;
  originalColor?: number | string;
}

export class DialogManager {
  private scene: Phaser.Scene;
  private navigationManager: NavigationManager;
  private dialogElements: IDialogElement[] = [];
  private dialogFocusIndex = 0;
  private modal: Phaser.GameObjects.Rectangle | null = null;
  private input: Phaser.GameObjects.DOMElement | null = null;
  private confirmBtn: Phaser.GameObjects.Text | null = null;
  private cancelBtn: Phaser.GameObjects.Text | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private errorText: Phaser.GameObjects.Text | null = null;
  private aboutText: Phaser.GameObjects.Text | null = null;
  private referenceText: Phaser.GameObjects.Text | null = null;
  private closeBtn: Phaser.GameObjects.Text | null = null;
  private onConfirm: (name: string) => boolean = () => false;
  private onCancel: () => void = () => {};

  constructor(scene: Phaser.Scene, navigationManager: NavigationManager) {
    this.scene = scene;
    this.navigationManager = navigationManager;
  }

  public showAddPlayerDialog(onConfirm: (name: string) => boolean, onCancel: () => void) {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.errorText = null;

    this.modal = this.scene.add.rectangle(400, 225, 400, 200, 0x000000, 0.8).setDepth(10).setInteractive();
    this.titleText = this.scene.add.text(400, 145, 'Enter Player Name', { fontSize: '20px', color: '#ffffff', fontFamily: 'Orbitron' }).setOrigin(0.5).setDepth(11);

    this.input = this.scene.add.dom(400, 205, 'input', {
      type: 'text',
      placeholder: 'Name (max 20 chars)',
      maxLength: 20,
      style: 'width: 300px; font-size: 18px; padding: 8px; text-align: center;'
    }).setDepth(11);

    this.confirmBtn = this.scene.add.text(340, 265, 'OK', { fontSize: '20px', color: '#00ff00', fontFamily: 'Orbitron' })
      .setOrigin(0.5).setInteractive().setDepth(11)
      .on('pointerdown', () => this.handleConfirm());

    this.cancelBtn = this.scene.add.text(460, 265, 'Cancel', { fontSize: '20px', color: '#ff0000', fontFamily: 'Orbitron' })
      .setOrigin(0.5).setInteractive().setDepth(11)
      .on('pointerdown', () => this.handleCancel());

    this.dialogElements = [
      { obj: this.input, type: 'input', action: () => {} },
      { obj: this.confirmBtn, type: 'ok', action: () => this.handleConfirm() },
      { obj: this.cancelBtn, type: 'cancel', action: () => this.handleCancel() }
    ];

    this.dialogFocusIndex = 0;
    this.highlightDialog();

    this.navigationManager.openDialog(this.dialogElements, () => this.closeDialog());
  }

  public showAboutDialog(onClose: () => void) {
    this.onCancel = onClose;

    this.modal = this.scene.add.rectangle(400, 300, 600, 450, 0x000000, 0.8).setDepth(10).setInteractive();
    this.titleText = this.scene.add.text(400, 100, 'About This Game: Reducing Cognitive Load Through Mastery', { fontSize: '18px', color: '#ffffff', fontFamily: 'Orbitron', fontStyle: 'bold' , align: 'center', wordWrap: { width: 500 } }).setOrigin(0.5).setDepth(11);

    const description = 'Alien X Defender gamifies multiplication table practice (2x2 to 12x12) to build automaticity—effortless recall of facts like "7 x 8 = 56." Research shows basic facts initially consume limited "slots" in working memory, overloading the brain during complex problem-solving. By adapting puzzles to your weaknesses, rewarding quick accuracy, and tracking progress via competency ratings, Alien X Defender automates these facts into long-term memory, freeing mental space for deeper math reasoning and reducing errors.';
    this.aboutText = this.scene.add.text(400, 240, description,{ fontSize: '16px', color: '#ffffff', fontFamily: 'Orbitron', align: 'left', wordWrap: { width: 500 } }).setOrigin(0.5).setDepth(11);

    const reference = 'Reference: Ding, Y., et al. (2017). "Working memory load and automaticity in relation to mental multiplication." The Journal of Educational Research, 110(5), 532-540.';
    this.referenceText = this.scene.add.text(400, 380, reference, { fontSize: '12px', color: '#ffffff', fontFamily: 'Orbitron', align: 'center', wordWrap: { width: 500 } }).setOrigin(0.5).setDepth(11);

    this.closeBtn = this.scene.add.text(400, 470, 'Close', { fontSize: '20px', color: '#00ff00', fontFamily: 'Orbitron' })
      .setOrigin(0.5).setInteractive().setDepth(11)
      .on('pointerdown', () => this.handleClose());

    this.dialogElements = [
      { obj: this.closeBtn, type: 'ok', action: () => this.handleClose() }
    ];

    this.dialogFocusIndex = 0;
    this.highlightDialog();

    this.navigationManager.openDialog(this.dialogElements, () => this.closeDialog());
  }

  private handleConfirm() {
    const name = (this.input!.node as HTMLInputElement).value.trim();
    const success = this.onConfirm(name);
    if (success) {
      this.closeDialog();
    }
  }

  private handleCancel() {
    this.onCancel();
    this.closeDialog();
  }

  private handleClose() {
    this.onCancel();
    this.closeDialog();
  }

  public showError(message: string) {
    if (this.errorText) this.errorText.destroy();
    this.errorText = this.scene.add.text(400, 275, message, { fontSize: '14px', color: '#ff0000', fontFamily: 'Orbitron' }).setOrigin(0.5).setDepth(11);
  }

  public closeDialog() {
    if (this.modal) this.modal.destroy();
    if (this.input) this.input.destroy();
    if (this.confirmBtn) this.confirmBtn.destroy();
    if (this.cancelBtn) this.cancelBtn.destroy();
    if (this.titleText) this.titleText.destroy();
    if (this.errorText) this.errorText.destroy();
    if (this.aboutText) this.aboutText.destroy();
    if (this.referenceText) this.referenceText.destroy();
    if (this.closeBtn) this.closeBtn.destroy();
    this.dialogElements = [];
    this.navigationManager.closeDialog();
  }


  private highlightDialog() {
    this.dialogElements.forEach((el, i) => {
      if (el.type === 'ok' || el.type === 'cancel') {
        const text = el.obj as Phaser.GameObjects.Text;
        text.setStyle({ color: i === this.dialogFocusIndex ? '#ffff00' : (el.type === 'ok' ? '#00ff00' : '#ff0000') });
      }
      if (el.type === 'input') {
        const inputEl = el.obj as Phaser.GameObjects.DOMElement;
        (inputEl.node as HTMLInputElement).style.border = i === this.dialogFocusIndex ? '2px solid yellow' : '1px solid #ccc';
      }
    });
  }
}