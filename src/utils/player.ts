// src/utils/player.ts
import { initialTable } from '../constants';

export type Player = {
  name: string;
};

export const getPlayerList = (): string[] => {
  const list = localStorage.getItem('playerList');
  return list ? JSON.parse(list) : [];
};

export const savePlayerList = (players: string[]) => {
  localStorage.setItem('playerList', JSON.stringify(players));
};

export const addPlayer = (name: string): boolean => {
  if (!name.trim() || name.length > 20) return false;
  const players = getPlayerList();
  if (players.includes(name)) return false;
  players.push(name);
  savePlayerList(players);
  setActivePlayer(name);
  initializePlayerData(name);
  return true;
};

export const setActivePlayer = (name: string) => {
  localStorage.setItem('activePlayer', name);
};

export const getActivePlayer = (): string | null => {
  return localStorage.getItem('activePlayer');
};

export const initializePlayerData = (name: string) => {
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
};

export const getPlayerDataKey = (suffix: string): string => {
  const player = getActivePlayer();
  if (!player) throw new Error('No active player');
  return `player_${player}_${suffix}`;
};