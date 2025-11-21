import { initialTable } from '../constants';
import { getPlayerDataKey } from './player';

export type CompetencyEntry = {
  puzzle: string;
  rating: number;
  userRating: number;
};

export type AnswerHistoryEntry = {
  puzzle: string;
  time: number;
  correct: boolean;
};

export type GlobalState = {
  playCount: number;
};

export type PlayerState = {
  competencies: CompetencyEntry[];
  answerHistory: AnswerHistoryEntry[];
  globalState: GlobalState;
  highestMastery: number;
};

export interface PlayerStatePersistence {
  savePlayerState(state: PlayerState): void;
  loadPlayerState(): PlayerState;
  initializePlayerState(): PlayerState;
  getPlayerList(): string[];
  savePlayerList(players: string[]): void;
  setActivePlayer(name: string): void;
  getActivePlayer(): string | null;
  initializePlayerData(name: string): void;
}

export class LocalStoragePlayerStatePersistence implements PlayerStatePersistence {
  savePlayerState(state: PlayerState): void {
    const competencyKey = getPlayerDataKey('competencyTable');
    const historyKey = getPlayerDataKey('answerHistory');
    const globalKey = getPlayerDataKey('playCount');
    const highestKey = getPlayerDataKey('highestMastery');

    localStorage.setItem(competencyKey, JSON.stringify(state.competencies));
    localStorage.setItem(historyKey, JSON.stringify(state.answerHistory));
    localStorage.setItem(globalKey, state.globalState.playCount.toString());
    localStorage.setItem(highestKey, state.highestMastery.toString());
  }

  loadPlayerState(): PlayerState {
    const competencyKey = getPlayerDataKey('competencyTable');
    const historyKey = getPlayerDataKey('answerHistory');
    const globalKey = getPlayerDataKey('playCount');
    const highestKey = getPlayerDataKey('highestMastery');

    const competencies: CompetencyEntry[] = JSON.parse(localStorage.getItem(competencyKey) || '[]');
    const answerHistory: AnswerHistoryEntry[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const playCount = parseInt(localStorage.getItem(globalKey) || '0');
    const highestMastery = parseInt(localStorage.getItem(highestKey) || '0');

    return {
      competencies,
      answerHistory,
      globalState: { playCount },
      highestMastery
    };
  }

  initializePlayerState(): PlayerState {
    const state: PlayerState = {
      competencies: initialTable,
      answerHistory: [],
      globalState: { playCount: 0 },
      highestMastery: 0
    };

    this.savePlayerState(state);
    return state;
  }

  getPlayerList(): string[] {
    const list = localStorage.getItem('playerList');
    return list ? JSON.parse(list) : [];
  }

  savePlayerList(players: string[]): void {
    localStorage.setItem('playerList', JSON.stringify(players));
  }

  setActivePlayer(name: string): void {
    localStorage.setItem('activePlayer', name);
  }

  getActivePlayer(): string | null {
    return localStorage.getItem('activePlayer');
  }

  initializePlayerData(name: string): void {
    const key = (suffix: string) => `player_${name}_${suffix}`;

    if (!localStorage.getItem(key('competencyTable'))) {
      localStorage.setItem(key('competencyTable'), JSON.stringify(initialTable));
    }
    if (!localStorage.getItem(key('answerHistory'))) {
      localStorage.setItem(key('answerHistory'), JSON.stringify([]));
    }
    if (!localStorage.getItem(key('playCount'))) {
      localStorage.setItem(key('playCount'), '0');
    }
    if (!localStorage.getItem(key('highestMastery'))) {
      localStorage.setItem(key('highestMastery'), '0');
    }
  }
}

export const playerStatePersistence = new LocalStoragePlayerStatePersistence();