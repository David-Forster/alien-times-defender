import Phaser from 'phaser';

export interface IFocusableElement {
  obj: Phaser.GameObjects.GameObject;
  type: string;
  action: () => void;
  originalColor?: number | string;
}

export interface IUIManager {
  scrollUp: () => void;
  scrollDown: () => void;
  pageUp: () => void;
  pageDown: () => void;
  getPlayerCount: () => number;
  getMaxVisible: () => number;
  getScrollOffset: () => number;
  setScrollOffset: (offset: number) => void;
  updateButtons: () => void;
}

export class NavigationManager {
  private scene: Phaser.Scene;
  private uiManager: IUIManager;
  private focusableElements: IFocusableElement[] = [];
  private currentFocusIndex = 0;
  private keyMap: Map<string, () => void> = new Map();
  private dialogOpen = false;
  private dialogElements: IFocusableElement[] = [];
  private dialogFocusIndex = 0;
  private onDialogClose: () => void = () => {};

  constructor(scene: Phaser.Scene, uiManager: IUIManager) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.setupKeyMap();
    this.scene.input.keyboard.on('keydown', this.handleKeyDown.bind(this));
  }

  private setupKeyMap() {
    this.keyMap.set('Tab', () => this.handleTab(false));
    this.keyMap.set('ArrowDown', () => this.handleArrowDown());
    this.keyMap.set('ArrowUp', () => this.handleArrowUp());
    this.keyMap.set('PageUp', () => this.handlePageUp());
    this.keyMap.set('PageDown', () => this.handlePageDown());
    this.keyMap.set('ArrowLeft', () => this.handleArrowLeft());
    this.keyMap.set('ArrowRight', () => this.handleArrowRight());
    this.keyMap.set('Enter', () => this.handleEnter());
    this.keyMap.set('Escape', () => this.handleEscape());
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.dialogOpen) {
      this.handleDialogKey(event);
    } else {
      const handler = this.keyMap.get(event.key);
      if (handler) {
        event.preventDefault();
        handler();
      }
    }
  }

  private handleDialogKey(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      this.dialogFocusIndex = (this.dialogFocusIndex + (event.shiftKey ? -1 : 1) + this.dialogElements.length) % this.dialogElements.length;
      this.highlightDialog();
      if (this.dialogElements[this.dialogFocusIndex].type === 'input') {
        ((this.dialogElements[this.dialogFocusIndex].obj as Phaser.GameObjects.DOMElement).node as HTMLInputElement).focus();
      }
    } else if (event.key === 'ArrowDown') {
      this.dialogFocusIndex = (this.dialogFocusIndex + 1) % this.dialogElements.length;
      this.highlightDialog();
      if (this.dialogElements[this.dialogFocusIndex].type === 'input') {
        ((this.dialogElements[this.dialogFocusIndex].obj as Phaser.GameObjects.DOMElement).node as HTMLInputElement).focus();
      }
    } else if (event.key === 'ArrowUp') {
      this.dialogFocusIndex = (this.dialogFocusIndex - 1 + this.dialogElements.length) % this.dialogElements.length;
      this.highlightDialog();
      if (this.dialogElements[this.dialogFocusIndex].type === 'input') {
        ((this.dialogElements[this.dialogFocusIndex].obj as Phaser.GameObjects.DOMElement).node as HTMLInputElement).focus();
      }
    } else if (event.key === 'Enter') {
      if (this.dialogElements[this.dialogFocusIndex].type !== 'input') {
        this.dialogElements[this.dialogFocusIndex].action();
      }
    } else if (event.key === 'Escape') {
      this.closeDialog();
    }
  }

  private handleTab(shift: boolean) {
    this.currentFocusIndex = (this.currentFocusIndex + (shift ? -1 : 1) + this.focusableElements.length) % this.focusableElements.length;
    this.highlightMain();
  }

  private handleArrowDown() {
    const playerCount = this.uiManager.getPlayerCount();
    const maxVisible = this.uiManager.getMaxVisible();
    const scrollOffset = this.uiManager.getScrollOffset();
    if (this.currentFocusIndex === playerCount - 1 && scrollOffset < playerCount - maxVisible) {
      this.uiManager.scrollDown();
      this.currentFocusIndex = Math.min(this.currentFocusIndex, this.focusableElements.length - 1);
    } else if (this.currentFocusIndex < this.focusableElements.length - 1) {
      this.currentFocusIndex++;
    }
    this.highlightMain();
  }

  private handleArrowUp() {
    const scrollOffset = this.uiManager.getScrollOffset();
    if (this.currentFocusIndex === 0 && scrollOffset > 0) {
      this.uiManager.scrollUp();
      this.currentFocusIndex = Math.min(this.currentFocusIndex, this.focusableElements.length - 1);
    } else if (this.currentFocusIndex > 0) {
      this.currentFocusIndex--;
    }
    this.highlightMain();
  }

  private handlePageUp() {
    this.uiManager.pageUp();
    this.currentFocusIndex = Math.min(this.currentFocusIndex, this.focusableElements.length - 1);
    this.highlightMain();
  }

  private handlePageDown() {
    this.uiManager.pageDown();
    this.currentFocusIndex = Math.min(this.currentFocusIndex, this.focusableElements.length - 1);
    this.highlightMain();
  }

  private handleArrowLeft() {
    if (this.focusableElements[this.currentFocusIndex].type === 'add') {
      const startIndex = this.focusableElements.findIndex(el => el.type === 'start');
      if (startIndex !== -1) this.currentFocusIndex = startIndex;
    } else if (this.focusableElements[this.currentFocusIndex].type === 'start') {
      const addIndex = this.focusableElements.findIndex(el => el.type === 'add');
      if (addIndex !== -1) this.currentFocusIndex = addIndex;
    }
    this.highlightMain();
  }

  private handleArrowRight() {
    this.handleArrowLeft(); // same logic
  }

  private handleEnter() {
    this.focusableElements[this.currentFocusIndex].action();
  }

  private handleEscape() {
    this.closeDialog();
  }

  private highlightMain() {
    this.focusableElements.forEach((el, i) => {
      if (el.type === 'player' || el.type === 'add') {
        const rect = el.obj as Phaser.GameObjects.Rectangle;
        rect.setFillStyle(i === this.currentFocusIndex ? 0x666666 : el.originalColor as number);
      } else if (el.type === 'start') {
        const text = el.obj as Phaser.GameObjects.Text;
        text.setStyle({ backgroundColor: i === this.currentFocusIndex ? '#00aa00' : el.originalColor as string });
      }
    });
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

  public addFocusableElement(element: IFocusableElement) {
    this.focusableElements.push(element);
  }

  public setFocusableElements(elements: IFocusableElement[]) {
    this.focusableElements = elements;
  }

  public setCurrentFocusIndex(index: number) {
    this.currentFocusIndex = index;
    this.highlightMain();
  }

  public openDialog(elements: IFocusableElement[], onClose: () => void) {
    this.dialogOpen = true;
    this.dialogElements = elements;
    this.onDialogClose = onClose;
    this.dialogFocusIndex = 0;
    this.highlightDialog();
    if (this.dialogElements.length > 0 && this.dialogElements[0].type === 'input') {
      ((this.dialogElements[0].obj as Phaser.GameObjects.DOMElement).node as HTMLInputElement).focus();
    }
  }

  public closeDialog() {
    this.dialogOpen = false;
    this.dialogElements = [];
    this.onDialogClose();
    this.highlightMain();
  }

  public updateHighlight() {
    if (this.dialogOpen) {
      this.highlightDialog();
    } else {
      this.highlightMain();
    }
  }
}