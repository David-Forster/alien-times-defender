// src/utils/player.ts
import { initialTable } from '../constants';
import { playerStatePersistence } from './playerStatePersistence';

export type Player = {
  name: string;
};

export const getPlayerList = (): string[] => {
  return playerStatePersistence.getPlayerList();
};

export const savePlayerList = (players: string[]) => {
  playerStatePersistence.savePlayerList(players);
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
  playerStatePersistence.setActivePlayer(name);
};

export const getActivePlayer = (): string | null => {
  return playerStatePersistence.getActivePlayer();
};

export const initializePlayerData = (name: string) => {
  playerStatePersistence.initializePlayerData(name);
};

export const getPlayerDataKey = (suffix: string): string => {
  const player = getActivePlayer();
  if (!player) throw new Error('No active player');
  return `player_${player}_${suffix}`;
};