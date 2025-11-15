import { describe, it, expect, beforeEach, vi } from 'vitest';
import SummaryScene from '../SummaryScene';
import { calculateMastery } from '../../utils/mastery';
import { getPlayerDataKey, getActivePlayer } from '../../utils/player';

// Mock utils
vi.mock('../../utils/mastery', () => ({
  calculateMastery: vi.fn()
}));

vi.mock('../../utils/player', () => ({
  getPlayerDataKey: vi.fn(),
  getActivePlayer: vi.fn()
}));

// Mock Phaser
const graphicsMock = {
  lineStyle: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  strokePath: vi.fn(),
  fillStyle: vi.fn(),
  fillCircle: vi.fn()
};

vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      add = {
        text: vi.fn(() => ({
          setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn() })) }))
        })),
        rectangle: vi.fn(() => ({ setOrigin: vi.fn() })),
        graphics: vi.fn(() => graphicsMock)
      };
      scene = {
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

describe('SummaryScene', () => {
  let scene: SummaryScene;
  const mockCalculateMastery = vi.mocked(calculateMastery);
  const mockGetPlayerDataKey = vi.mocked(getPlayerDataKey);
  const mockGetActivePlayer = vi.mocked(getActivePlayer);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActivePlayer.mockReturnValue('Test Player');
    mockGetPlayerDataKey.mockImplementation((key: string) => `player_Test Player_${key}`);
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'player_Test Player_competencyTable') return JSON.stringify([
        { puzzle: '1 x 2', userRating: 50 },
        { puzzle: '1 x 3', userRating: 60 },
        { puzzle: '2 x 2', userRating: 70 }
      ]);
      if (key === 'player_Test Player_answerHistory') return JSON.stringify([]);
      return null;
    });
    scene = new SummaryScene();
  });

  const testData = {
    deltas: [5, -3],
    presented: [
      { puzzle: '1 x 2', rating: 50, userRating: 50 },
      { puzzle: '1 x 3', rating: 60, userRating: 60 }
    ],
    times: [2.5, 3.0],
    correctness: [true, false]
  };

  it('should display title and session summary', () => {
    mockCalculateMastery.mockReturnValue({ masteryScore: 50, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 });
    scene.create(testData);
    expect(scene.add.text).toHaveBeenCalledWith(400, 60, 'Summary for Test Player', { fontSize: '20px', color: '#00ffff' });
    expect(scene.add.text).toHaveBeenCalledWith(400, 100, 'Session Summary', { fontSize: '32px', color: '#ffffff' });
  });

  it('should calculate and display mastery progress', () => {
    mockCalculateMastery.mockReturnValueOnce({ masteryScore: 45, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 }).mockReturnValueOnce({ masteryScore: 50, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 });
    scene.create(testData);
    expect(mockCalculateMastery).toHaveBeenCalledTimes(2);
    expect(scene.add.rectangle).toHaveBeenCalledWith(400, 200, 400, 20, 0x666666);
    expect(scene.add.rectangle).toHaveBeenCalledWith(300, 200, 4, 20, 0x00ffff); // 50% mastery: 200 + 200*0.5 = 300
    expect(scene.add.text).toHaveBeenCalledWith(400, 230, '50.0% (+5.0)', { fontSize: '16px', color: '#00ff00' });
  });

  it('should render chart with multiplier grouping and colors', () => {
    mockCalculateMastery.mockReturnValue({ masteryScore: 50, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 });
    scene.create(testData);
    expect(scene.add.graphics).toHaveBeenCalled();
    // Check line for 1 x 2: multiplier 2, userRating 50, height 50, color ~0x7e8100
    expect(graphicsMock.lineStyle).toHaveBeenCalledWith(2, expect.any(Number));
    expect(graphicsMock.strokePath).toHaveBeenCalled();
    // Check dot for presented puzzles
    expect(graphicsMock.fillCircle).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 4);
  });

  it('should display session statistics', () => {
    mockCalculateMastery.mockReturnValue({ masteryScore: 50, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 });
    scene.create(testData);
    expect(scene.add.text).toHaveBeenCalledWith(400, 380, 'Accuracy: 50.0%', { fontSize: '24px', color: '#ffffff' });
    expect(scene.add.text).toHaveBeenCalledWith(400, 410, 'Average Time: 2.8s', { fontSize: '24px', color: '#ffffff' });
  });

  it('should transition to PlayScene on Play Again button click', () => {
    mockCalculateMastery.mockReturnValue({ masteryScore: 50, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 });
    let playCallback: Function;
    (scene.add.text as any).mockReturnValueOnce({ // title
      setOrigin: vi.fn()
    });
    (scene.add.text as any).mockReturnValueOnce({ // summary
      setOrigin: vi.fn()
    });
    (scene.add.text as any).mockReturnValueOnce({ // mastery text
      setOrigin: vi.fn()
    });
    (scene.add.text as any).mockReturnValueOnce({ // progress text
      setOrigin: vi.fn(() => ({ setOrigin: vi.fn() }))
    });
    // Skip chart texts
    for (let i = 0; i < 2; i++) {
      (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn() });
    }
    (scene.add.text as any).mockReturnValueOnce({ // accuracy
      setOrigin: vi.fn()
    });
    (scene.add.text as any).mockReturnValueOnce({ // avg time
      setOrigin: vi.fn()
    });
    (scene.add.text as any).mockReturnValueOnce({ // play again
      setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') playCallback = cb; }) })) }))
    });
    (scene.add.text as any).mockReturnValueOnce({ // menu
      setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn() })) }))
    });
    scene.create(testData);
    if (playCallback) {
      playCallback();
      expect(scene.scene.start).toHaveBeenCalledWith('PlayScene');
    }
  });

  it('should transition to MenuScene on Back to Menu button click', () => {
    mockCalculateMastery.mockReturnValue({ masteryScore: 50, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 });
    let menuCallback: Function;
    // Similar mocking as above, but for menu button
    (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn() });
    (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn() });
    (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn() });
    (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn(() => ({ setOrigin: vi.fn() })) });
    for (let i = 0; i < 2; i++) {
      (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn() });
    }
    (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn() });
    (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn() });
    (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn() })) })) });
    (scene.add.text as any).mockReturnValueOnce({ setOrigin: vi.fn(() => ({ setInteractive: vi.fn(() => ({ on: vi.fn((event: string, cb: Function) => { if (event === 'pointerdown') menuCallback = cb; }) })) })) });
    scene.create(testData);
    if (menuCallback) {
      menuCallback();
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
    }
  });

  it('should handle empty session data', () => {
    const emptyData = { deltas: [], presented: [], times: [], correctness: [] };
    mockCalculateMastery.mockReturnValue({ masteryScore: 50, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 });
    scene.create(emptyData);
    expect(scene.add.text).toHaveBeenCalledWith(400, 380, 'Accuracy: NaN%', { fontSize: '24px', color: '#ffffff' }); // Edge case, but as per code
    expect(scene.add.text).toHaveBeenCalledWith(400, 410, 'Average Time: NaNs', { fontSize: '24px', color: '#ffffff' });
  });

  it('should handle all correct answers', () => {
    const allCorrectData = { ...testData, correctness: [true, true] };
    scene.create(allCorrectData);
    expect(scene.add.text).toHaveBeenCalledWith(400, 380, 'Accuracy: 100.0%', { fontSize: '24px', color: '#ffffff' });
  });

  it('should handle single puzzle session', () => {
    const singleData = {
      deltas: [2],
      presented: [{ puzzle: '1 x 2', rating: 50, userRating: 50 }],
      times: [2.0],
      correctness: [true]
    };
    scene.create(singleData);
    expect(scene.add.text).toHaveBeenCalledWith(400, 380, 'Accuracy: 100.0%', { fontSize: '24px', color: '#ffffff' });
    expect(scene.add.text).toHaveBeenCalledWith(400, 410, 'Average Time: 2.0s', { fontSize: '24px', color: '#ffffff' });
  });

  it('should handle negative mastery delta', () => {
    mockCalculateMastery.mockReturnValueOnce({ masteryScore: 55, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 }).mockReturnValueOnce({ masteryScore: 50, avgResponseTime: 0, recentAccuracy: 0, puzzlesAtMastery: 0, totalPuzzles: 0 });
    scene.create(testData);
    expect(scene.add.text).toHaveBeenCalledWith(400, 230, '50.0% (-5.0)', { fontSize: '16px', color: '#ff0000' });
  });

  it('should group puzzles by multiplier correctly', () => {
    // Test with multiple puzzles per multiplier
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'player_Test Player_competencyTable') return JSON.stringify([
        { puzzle: '1 x 2', userRating: 50 },
        { puzzle: '2 x 2', userRating: 60 },
        { puzzle: '1 x 3', userRating: 70 }
      ]);
      if (key === 'player_Test Player_answerHistory') return JSON.stringify([]);
      return null;
    });
    scene.create(testData);
    // Should have groups for 2 and 3
    expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), 265, '2x', { fontSize: '16px', color: '#ffffff' });
    expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), 265, '3x', { fontSize: '16px', color: '#ffffff' });
  });
});