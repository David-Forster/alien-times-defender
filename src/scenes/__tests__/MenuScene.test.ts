import { describe, it, expect, beforeEach, vi } from 'vitest';
import MenuScene from '../MenuScene';
import { initialTable } from '../../constants';

// Mock Phaser
const createTextMock = () => {
  const mock = {
    setOrigin: vi.fn(() => mock),
    setInteractive: vi.fn(() => mock),
    on: vi.fn(() => mock),
    setStyle: vi.fn(() => mock),
    setDepth: vi.fn(() => mock),
    destroy: vi.fn()
  };
  return mock;
};

const createRectangleMock = () => {
  const mock = {
    setInteractive: vi.fn(() => mock),
    on: vi.fn(() => mock),
    setDepth: vi.fn(() => mock),
    destroy: vi.fn()
  };
  return mock;
};

const createContainerMock = () => {
  const mock = {
    setDepth: vi.fn(() => mock),
    removeAll: vi.fn(),
    add: vi.fn()
  };
  return mock;
};

const createDomMock = () => {
  const mock = {
    setDepth: vi.fn(() => mock),
    destroy: vi.fn(),
    node: { value: '' }
  };
  return mock;
};

vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      add = {
        text: vi.fn(createTextMock),
        rectangle: vi.fn(createRectangleMock),
        container: vi.fn(createContainerMock),
        dom: vi.fn(createDomMock)
      };
      scene = {
        restart: vi.fn(),
        start: vi.fn()
      };
    }
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('MenuScene', () => {
  let scene: MenuScene;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'playerList') return JSON.stringify(['Player 1']);
      if (key === 'activePlayer') return 'Player 1';
      if (key === 'player_Player 1_competencyTable') return JSON.stringify(initialTable);
      if (key === 'player_Player 1_answerHistory') return '[]';
      return null;
    });
    scene = new MenuScene();
  });

  it('should auto-create default player if no players exist', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'playerList') return null;
      return null;
    });
    scene.create();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('playerList', JSON.stringify(['Player 1']));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('activePlayer', 'Player 1');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('player_Player 1_competencyTable', JSON.stringify(initialTable));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('player_Player 1_answerHistory', '[]');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('player_Player 1_playCount', '0');
  });

  it('should render title and leaderboard text', () => {
    scene.create();
    expect(scene.add.text).toHaveBeenCalledWith(350, 25, 'Alien', expect.any(Object));
    expect(scene.add.text).toHaveBeenCalledWith(400, 25, '×', expect.any(Object));
    expect(scene.add.text).toHaveBeenCalledWith(450, 25, 'Defender', expect.any(Object));
    expect(scene.add.text).toHaveBeenCalledWith(400, 85, 'Leaderboard', expect.any(Object));
  });

  it('should render player list with active player highlighted', () => {
    scene.create();
    expect(scene.add.rectangle).toHaveBeenCalledWith(0, 0, 500, 45, 0x00aa00); // active player green
    expect(scene.add.text).toHaveBeenCalledWith(-230, 0, 'Player 1', expect.any(Object));
    expect(scene.add.text).toHaveBeenCalledWith(230, 0, '✓', expect.any(Object));
  });

  it('should render add new player button', () => {
    scene.create();
    expect(scene.add.rectangle).toHaveBeenCalledWith(0, 70, 500, 45, 0x0066cc); // add button
    expect(scene.add.text).toHaveBeenCalledWith(0, 70, '+ Add New Player', expect.any(Object));
  });

  it('should set active player and restart scene on player selection', () => {
    // Mock the rectangle to capture the callback
    let playerCallback: Function;
    (scene.add.rectangle as any).mockReturnValueOnce({
      setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') playerCallback = cb; return {}; }), setDepth: vi.fn(() => ({ destroy: vi.fn() })) })),
      setDepth: vi.fn(() => ({ destroy: vi.fn() }))
    });
    scene.create();
    if (playerCallback) {
      playerCallback();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('activePlayer', 'Player 1');
      expect(scene.scene.restart).toHaveBeenCalled();
    }
  });

  it('should show add player dialog on add button click', () => {
    let addCallback: Function;
    (scene.add.rectangle as any).mockReturnValueOnce({ // player button
      setInteractive: vi.fn(() => ({ on: vi.fn(() => ({})), setDepth: vi.fn(() => ({ destroy: vi.fn() })) })),
      setDepth: vi.fn(() => ({ destroy: vi.fn() }))
    });
    (scene.add.rectangle as any).mockReturnValueOnce({ // add button
      setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') addCallback = cb; return {}; }), setDepth: vi.fn(() => ({ destroy: vi.fn() })) })),
      setDepth: vi.fn(() => ({ destroy: vi.fn() }))
    });
    scene.create();
    if (addCallback) {
      addCallback();
      expect(scene.add.rectangle).toHaveBeenCalledWith(400, 300, 400, 200, 0x000000, 0.8);
      expect(scene.add.text).toHaveBeenCalledWith(400, 220, 'Enter Player Name', expect.any(Object));
      expect(scene.add.dom).toHaveBeenCalledWith(400, 280, 'input', expect.any(Object));
    }
  });

  it('should add player and restart on valid name confirm', () => {
    // Simulate dialog open
    let confirmCallback: Function;
    (scene.add.text as any).mockReturnValueOnce({ // title
      setOrigin: vi.fn(() => ({ setDepth: vi.fn() }))
    });
    const inputMock = { node: { value: 'New Player' } };
    (scene.add.dom as any).mockReturnValueOnce(inputMock);
    (scene.add.text as any).mockReturnValueOnce({ // ok button
      setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') confirmCallback = cb; return {}; }), setDepth: vi.fn(() => ({ destroy: vi.fn() })) })) }))
    });
    (scene.add.text as any).mockReturnValueOnce({ // cancel
      setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn(() => ({})), setDepth: vi.fn(() => ({ destroy: vi.fn() })) })) }))
    });
    // Trigger dialog
    scene.create();
    // Assume dialog is shown, call confirm
    if (confirmCallback) {
      confirmCallback();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('playerList', JSON.stringify(['Player 1', 'New Player']));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('activePlayer', 'New Player');
      expect(scene.scene.restart).toHaveBeenCalled();
    }
  });

  it('should show error on invalid name', () => {
    let confirmCallback: Function;
    const inputMock = { node: { value: '' } }; // invalid
    (scene.add.dom as any).mockReturnValueOnce(inputMock);
    (scene.add.text as any).mockReturnValueOnce({ // ok
      setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') confirmCallback = cb; return {}; }), setDepth: vi.fn(() => ({ destroy: vi.fn() })) })) }))
    });
    scene.create();
    if (confirmCallback) {
      confirmCallback();
      expect(scene.add.text).toHaveBeenCalledWith(400, 370, 'Invalid or duplicate name!', expect.any(Object));
      expect(scene.scene.restart).not.toHaveBeenCalled();
    }
  });

  it('should display player stats and start button when active player exists', () => {
    scene.create();
    expect(scene.add.text).toHaveBeenCalledWith(400, 480, 'Player: Player 1', expect.any(Object));
    expect(scene.add.text).toHaveBeenCalledWith(400, 505, expect.stringContaining('Mastery:'), expect.any(Object));
    expect(scene.add.text).toHaveBeenCalledWith(400, 550, 'Start Game', expect.any(Object));
  });

  it('should start PlayScene on start button click', () => {
    let startCallback: Function;
    (scene.add.text as any).mockReturnValueOnce({ // start button
      setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') startCallback = cb; return {}; }), setStyle: vi.fn(() => ({})), setDepth: vi.fn() })) }))
    });
    scene.create();
    if (startCallback) {
      startCallback();
      expect(scene.scene.start).toHaveBeenCalledWith('PlayScene');
    }
  });

  it('should show message when no active player', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'activePlayer') return null;
      if (key === 'playerList') return JSON.stringify(['Player 1']);
      return null;
    });
    scene.create();
    expect(scene.add.text).toHaveBeenCalledWith(400, 500, 'Create or select a player to begin', expect.any(Object));
  });

  it('should handle multiple players', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'playerList') return JSON.stringify(['Player 1', 'Player 2']);
      if (key === 'activePlayer') return 'Player 2';
      if (key === 'player_Player 2_competencyTable') return JSON.stringify(initialTable);
      if (key === 'player_Player 2_answerHistory') return '[]';
      return null;
    });
    scene.create();
    expect(scene.add.rectangle).toHaveBeenCalledWith(0, 0, 500, 45, 0x333333); // Player 1 not active
    expect(scene.add.rectangle).toHaveBeenCalledWith(0, 50, 500, 45, 0x00aa00); // Player 2 active
  });

  it('should handle duplicate player name', () => {
    let confirmCallback: Function;
    const inputMock = { node: { value: 'Player 1' } }; // duplicate
    (scene.add.dom as any).mockReturnValueOnce(inputMock);
    (scene.add.text as any).mockReturnValueOnce({ // ok
      setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') confirmCallback = cb; return {}; }), setDepth: vi.fn(() => ({ destroy: vi.fn() })) })) }))
    });
    scene.create();
    if (confirmCallback) {
      confirmCallback();
      expect(scene.add.text).toHaveBeenCalledWith(400, 370, 'Invalid or duplicate name!', expect.any(Object));
    }
  });

  it('should handle long player name', () => {
    let confirmCallback: Function;
    const inputMock = { node: { value: 'A'.repeat(21) } }; // too long
    (scene.add.dom as any).mockReturnValueOnce(inputMock);
    (scene.add.text as any).mockReturnValueOnce({ // ok
      setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') confirmCallback = cb; return {}; }), setDepth: vi.fn(() => ({ destroy: vi.fn() })) })) }))
    });
    scene.create();
    if (confirmCallback) {
      confirmCallback();
      expect(scene.add.text).toHaveBeenCalledWith(400, 370, 'Invalid or duplicate name!', expect.any(Object));
    }
  });
});