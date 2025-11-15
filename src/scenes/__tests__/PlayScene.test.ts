import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import PlayScene from '../PlayScene';
import { initialTable, GAME_LENGTH, EARLY_SESSION_THRESHOLD, TIMER_DELAY_MS, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR, PUZZLE_FONT_SIZE, INPUT_FONT_SIZE, FEEDBACK_FONT_SIZE, SCREEN_CENTER_X, PUZZLE_Y, INPUT_Y, TIMER_BAR_Y, FEEDBACK_Y, MIN_RATING, MAX_RATING, FEEDBACK_DELAY_MS, TIMEOUT_TIME } from '../../constants';
import { getActivePlayer } from '../../utils/player';

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      add = {
        text: vi.fn(() => ({
          setOrigin: vi.fn(() => ({ destroy: vi.fn() })),
          setText: vi.fn(() => ({ setOrigin: vi.fn(() => ({ destroy: vi.fn() })) })),
          destroy: vi.fn()
        })),
        rectangle: vi.fn(() => ({
          setOrigin: vi.fn(() => ({ destroy: vi.fn() }))
        }))
      };
      scene = {
        start: vi.fn()
      };
      time = {
        addEvent: vi.fn(() => ({ remove: vi.fn() })),
        delayedCall: vi.fn()
      };
      tweens = {
        add: vi.fn(),
        killTweensOf: vi.fn()
      };
      input = {
        keyboard: {
          on: vi.fn(),
          off: vi.fn()
        }
      };
    },
    Utils: {
      Array: {
        Shuffle: vi.fn((array: any[]) => array.slice().sort(() => Math.random() - 0.5))
      }
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

// Mock player utils
vi.mock('../../utils/player', () => ({
  getPlayerDataKey: vi.fn((key: string) => `player_test_${key}`),
  getActivePlayer: vi.fn(() => 'testPlayer'),
  initializePlayerData: vi.fn()
}));

// Mock Math.random for deterministic tests
const mockMath = Object.create(global.Math);
mockMath.random = vi.fn(() => 0.5);
global.Math = mockMath;

// Mock Date.now
const mockDateNow = vi.fn(() => 1000);
Date.now = mockDateNow;

describe('PlayScene', () => {
  let scene: PlayScene;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    mockDateNow.mockReturnValue(1000);
    scene = new PlayScene();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should redirect to MenuScene if no active player', () => {
      (getActivePlayer as any).mockReturnValueOnce(null);
      scene.create();
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
    });

    it('should load player data and initialize for early session', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'player_test_competencyTable') return JSON.stringify(initialTable);
        if (key === 'player_test_answerHistory') return '[]';
        if (key === 'player_test_playCount') return '2'; // early session
        return null;
      });

      scene.create();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('player_test_competencyTable');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('player_test_answerHistory');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('player_test_playCount');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('player_test_playCount', '3');
      expect(scene.playCount).toBe(3);
      expect(scene.competencyTable).toEqual(initialTable);
      expect(scene.answerHistory).toEqual([]);
      expect(scene.puzzles.length).toBe(GAME_LENGTH);
      expect(scene.currentIndex).toBe(0);
      expect(scene.deltas).toEqual([]);
      expect(scene.times).toEqual([]);
      expect(scene.correctness).toEqual([]);
    });

    it('should use adaptive selection for later sessions', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'player_test_competencyTable') return JSON.stringify(initialTable);
        if (key === 'player_test_answerHistory') return '[]';
        if (key === 'player_test_playCount') return '10'; // later session
        return null;
      });

      scene.create();

      expect(scene.puzzles.length).toBe(GAME_LENGTH);
      // Adaptive selection should be called
    });
  });

  describe('selectPuzzlesAdaptive', () => {
    it('should select puzzles with priority: near-mastery, weak, random', () => {
      const competencyTable: any[] = [
        { puzzle: '1 x 1', rating: 1, userRating: 5 }, // near-mastery
        { puzzle: '2 x 2', rating: 2, userRating: 10 }, // near-mastery
        { puzzle: '3 x 3', rating: 3, userRating: 35 }, // weak
        { puzzle: '4 x 4', rating: 4, userRating: 25 }, // random
        { puzzle: '5 x 5', rating: 5, userRating: 15 }, // near-mastery
      ];

      const result = (scene as any).selectPuzzlesAdaptive(competencyTable, 5);

      expect(result.length).toBe(5);
      // Check that all selected are from the table
      result.forEach((p: any) => {
        expect(competencyTable).toContainEqual(p);
      });
      // Check that near-mastery are included (since 60% priority)
      const hasNearMastery = result.some((p: any) => p.userRating >= 6 && p.userRating <= 15);
      expect(hasNearMastery).toBe(true);
    });

    it('should handle empty near-mastery and weak categories', () => {
      const competencyTable: any[] = [
        { puzzle: '1 x 1', rating: 1, userRating: 25 },
        { puzzle: '2 x 2', rating: 2, userRating: 26 },
        { puzzle: '3 x 3', rating: 3, userRating: 27 },
      ];

      const result = (scene as any).selectPuzzlesAdaptive(competencyTable, 3);

      expect(result.length).toBe(3);
      // Check that all puzzles are selected (order may vary due to shuffle)
      expect(result).toEqual(expect.arrayContaining(competencyTable));
      expect(competencyTable).toEqual(expect.arrayContaining(result));
    });

    it('should not exceed available puzzles', () => {
      const competencyTable: any[] = [
        { puzzle: '1 x 1', rating: 1, userRating: 10 },
      ];

      const result = (scene as any).selectPuzzlesAdaptive(competencyTable, 5);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual(competencyTable[0]);
    });
  });

  describe('presentPuzzle', () => {
    beforeEach(() => {
      scene.puzzles = [{ puzzle: '2 x 3', rating: 6, userRating: 20 }];
      scene.currentIndex = 0;
    });

    it('should set up puzzle display and timer', () => {
      scene.presentPuzzle();

      expect(scene.add.text).toHaveBeenCalledWith(SCREEN_CENTER_X, PUZZLE_Y, '2 x 3 = ', { fontSize: PUZZLE_FONT_SIZE, color: '#ffffff' });
      expect(scene.add.text).toHaveBeenCalledWith(SCREEN_CENTER_X, INPUT_Y, '', { fontSize: INPUT_FONT_SIZE, color: '#ffffff' });
      expect(scene.time.addEvent).toHaveBeenCalledWith({ delay: TIMER_DELAY_MS, callback: scene.onTimeout, callbackScope: scene });
      expect(scene.add.rectangle).toHaveBeenCalledWith(SCREEN_CENTER_X, TIMER_BAR_Y, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, TIMER_BAR_COLOR);
      expect(scene.tweens.add).toHaveBeenCalledWith({
        targets: expect.any(Object),
        scaleX: 0,
        duration: TIMER_DELAY_MS,
        ease: 'Linear'
      });
      expect(scene.input.keyboard.on).toHaveBeenCalledWith('keydown', scene.handleKey, scene);
    });
  });

  describe('handleKey', () => {
    beforeEach(() => {
      scene.inputText = { setText: vi.fn() } as any;
      scene.answer = '';
    });

    it('should append numbers to answer', () => {
      const event = { key: '5' } as KeyboardEvent;
      scene.handleKey(event);
      expect(scene.answer).toBe('5');
      expect(scene.inputText.setText).toHaveBeenCalledWith('5');
    });

    it('should handle backspace', () => {
      scene.answer = '123';
      const event = { key: 'Backspace' } as KeyboardEvent;
      scene.handleKey(event);
      expect(scene.answer).toBe('12');
      expect(scene.inputText.setText).toHaveBeenCalledWith('12');
    });

    it('should submit answer on enter', () => {
      scene.submitAnswer = vi.fn();
      const event = { key: 'Enter' } as KeyboardEvent;
      scene.handleKey(event);
      expect(scene.submitAnswer).toHaveBeenCalled();
    });

    it('should ignore other keys', () => {
      scene.answer = '1';
      const event = { key: 'a' } as KeyboardEvent;
      scene.handleKey(event);
      expect(scene.answer).toBe('1');
    });
  });

  describe('submitAnswer', () => {
    beforeEach(() => {
      scene.puzzles = [{ puzzle: '2 x 3', rating: 6, userRating: 20 }];
      scene.currentIndex = 0;
      scene.competencyTable = [{ puzzle: '2 x 3', rating: 6, userRating: 20 }];
      scene.deltas = [];
      scene.times = [];
      scene.correctness = [];
      scene.answerHistory = [];
      scene.startTime = 1000;
      mockDateNow.mockReturnValue(2000); // 1 second
      scene.inputText = { destroy: vi.fn() } as any;
      scene.timerBar = { destroy: vi.fn() } as any;
      scene.feedbackText = { destroy: vi.fn() } as any;
      scene.puzzleText = { destroy: vi.fn() } as any;
      scene.timerEvent = { remove: vi.fn() } as any; // Mock timerEvent
    });

    it('should handle correct answer and update rating', () => {
      scene.answer = '6';
      scene.submitAnswer();

      expect(scene.times).toEqual([1]);
      expect(scene.correctness).toEqual([true]);
      expect(scene.deltas).toEqual([-8]); // fast correct
      expect(scene.competencyTable[0].userRating).toBe(12); // 20 - 8
      expect(scene.add.text).toHaveBeenCalledWith(SCREEN_CENTER_X, FEEDBACK_Y, 'Correct! Time: 1.0s', { fontSize: FEEDBACK_FONT_SIZE, color: '#00ff00' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('player_test_competencyTable', JSON.stringify(scene.competencyTable));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('player_test_answerHistory', JSON.stringify([{ puzzle: '2 x 3', time: 1, correct: true }]));
      expect(scene.time.delayedCall).toHaveBeenCalledWith(FEEDBACK_DELAY_MS, scene.nextPuzzle, [], scene);
    });

    it('should handle incorrect answer and update rating', () => {
      scene.answer = '7';
      scene.submitAnswer();

      expect(scene.times).toEqual([1]);
      expect(scene.correctness).toEqual([false]);
      expect(scene.deltas).toEqual([8]); // wrong, userRating <=20
      expect(scene.competencyTable[0].userRating).toBe(28);
      expect(scene.add.text).toHaveBeenCalledWith(SCREEN_CENTER_X, FEEDBACK_Y, 'Incorrect. Answer was 6', { fontSize: FEEDBACK_FONT_SIZE, color: '#ff0000' });
    });

    it('should apply different deltas based on time for correct answers', () => {
      // Slow correct (6 seconds: <=10.0 -> -2)
      mockDateNow.mockReturnValue(7000);
      scene.answer = '6';
      scene.submitAnswer();
      expect(scene.deltas).toEqual([-2]);

      // Reset
      scene.deltas = [];
      scene.times = [];
      scene.correctness = [];
      scene.startTime = 1000;
      mockDateNow.mockReturnValue(3000); // 2 seconds (<=2.0 -> -8)
      scene.answer = '6';
      scene.submitAnswer();
      expect(scene.deltas).toEqual([-8]);
    });

    it('should cap rating at MIN_RATING and MAX_RATING', () => {
      scene.competencyTable[0].userRating = 5; // near min
      scene.answer = '6'; // correct
      scene.submitAnswer();
      expect(scene.competencyTable[0].userRating).toBe(MIN_RATING);

      // Reset
      scene.deltas = [];
      scene.times = [];
      scene.correctness = [];
      scene.competencyTable[0].userRating = 95; // near max
      scene.answer = '7'; // wrong
      scene.submitAnswer();
      expect(scene.competencyTable[0].userRating).toBe(MAX_RATING);
    });
  });

  describe('onTimeout', () => {
    beforeEach(() => {
      scene.puzzles = [{ puzzle: '2 x 3', rating: 6, userRating: 20 }];
      scene.currentIndex = 0;
      scene.competencyTable = [{ puzzle: '2 x 3', rating: 6, userRating: 20 }];
      scene.deltas = [];
      scene.times = [];
      scene.correctness = [];
      scene.answerHistory = [];
      scene.inputText = { destroy: vi.fn() } as any;
      scene.timerBar = { destroy: vi.fn() } as any;
      scene.feedbackText = { destroy: vi.fn() } as any;
      scene.puzzleText = { destroy: vi.fn() } as any;
    });

    it('should apply timeout penalty and update rating', () => {
      scene.onTimeout();

      expect(scene.times).toEqual([TIMEOUT_TIME]);
      expect(scene.correctness).toEqual([false]);
      expect(scene.deltas).toEqual([8]); // penalty
      expect(scene.competencyTable[0].userRating).toBe(28);
      expect(scene.add.text).toHaveBeenCalledWith(SCREEN_CENTER_X, INPUT_Y, 'Timeout. Answer was 6', { fontSize: FEEDBACK_FONT_SIZE, color: '#ff0000' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('player_test_competencyTable', JSON.stringify(scene.competencyTable));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('player_test_answerHistory', JSON.stringify([{ puzzle: '2 x 3', time: TIMEOUT_TIME, correct: false }]));
      expect(scene.time.delayedCall).toHaveBeenCalledWith(FEEDBACK_DELAY_MS, scene.nextPuzzle, [], scene);
    });
  });

  describe('nextPuzzle', () => {
    beforeEach(() => {
      scene.puzzles = [{ puzzle: '2 x 3', rating: 6, userRating: 20 }, { puzzle: '3 x 4', rating: 12, userRating: 25 }];
      scene.currentIndex = 0;
      scene.deltas = [5];
      scene.times = [2];
      scene.correctness = [true];
      scene.puzzleText = { destroy: vi.fn() } as any;
      scene.inputText = { destroy: vi.fn() } as any;
      scene.timerBar = { destroy: vi.fn() } as any;
      scene.feedbackText = { destroy: vi.fn() } as any;
    });

    it('should clear UI and present next puzzle if more remain', () => {
      scene.presentPuzzle = vi.fn();
      scene.nextPuzzle();

      expect(scene.puzzleText.destroy).toHaveBeenCalled();
      expect(scene.inputText.destroy).toHaveBeenCalled();
      expect(scene.timerBar.destroy).toHaveBeenCalled();
      expect(scene.feedbackText.destroy).toHaveBeenCalled();
      expect(scene.currentIndex).toBe(1);
      expect(scene.presentPuzzle).toHaveBeenCalled();
    });

    it('should transition to SummaryScene when all puzzles completed', () => {
      scene.currentIndex = 1; // last puzzle
      scene.nextPuzzle();

      expect(scene.scene.start).toHaveBeenCalledWith('SummaryScene', {
        deltas: [5],
        presented: scene.puzzles,
        times: [2],
        correctness: [true]
      });
    });
  });

  describe('clearUI', () => {
    it('should destroy all UI elements', () => {
      scene.puzzleText = { destroy: vi.fn() } as any;
      scene.inputText = { destroy: vi.fn() } as any;
      scene.timerBar = { destroy: vi.fn() } as any;
      scene.feedbackText = { destroy: vi.fn() } as any;

      scene.clearUI();

      expect(scene.puzzleText.destroy).toHaveBeenCalled();
      expect(scene.inputText.destroy).toHaveBeenCalled();
      expect(scene.timerBar.destroy).toHaveBeenCalled();
      expect(scene.feedbackText.destroy).toHaveBeenCalled();
    });
  });
});