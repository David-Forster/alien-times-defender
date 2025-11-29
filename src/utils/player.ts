// src/utils/player.ts
import { initialTable } from '../constants';
import { playerStatePersistence } from './playerStatePersistence';
import { calculateMastery } from './mastery';

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

export const renamePlayer = (oldName: string, newName: string): boolean => {
  if (!newName.trim() || newName.length > 20) return false;
  const players = getPlayerList();
  if (players.includes(newName)) return false;
  const index = players.indexOf(oldName);
  if (index === -1) return false;
  players[index] = newName;
  savePlayerList(players);

  // Update localStorage keys
  const suffixes = ['competencyTable', 'answerHistory', 'playCount', 'highestMastery'];
  suffixes.forEach(suffix => {
    const oldKey = `player_${oldName}_${suffix}`;
    const newKey = `player_${newName}_${suffix}`;
    const value = localStorage.getItem(oldKey);
    if (value) {
      localStorage.setItem(newKey, value);
      localStorage.removeItem(oldKey);
    }
  });

  // Handle active player
  const active = getActivePlayer();
  if (active === oldName) {
    setActivePlayer(newName);
  }

  return true;
};

export const deletePlayer = (name: string): boolean => {
  const players = getPlayerList();
  const index = players.indexOf(name);
  if (index === -1) return false;
  players.splice(index, 1);
  savePlayerList(players);

  // Delete localStorage data
  const suffixes = ['competencyTable', 'answerHistory', 'playCount', 'highestMastery'];
  suffixes.forEach(suffix => {
    const key = `player_${name}_${suffix}`;
    localStorage.removeItem(key);
  });

  // Handle active player
  const active = getActivePlayer();
  if (active === name) {
    if (players.length > 0) {
      setActivePlayer(players[0]);
    } else {
      localStorage.removeItem('activePlayer');
    }
  }

  return true;
};

export const getPlayerMastery = (name: string) => {
  const competencyKey = `player_${name}_competencyTable`;
  const historyKey = `player_${name}_answerHistory`;
  const competencies = JSON.parse(localStorage.getItem(competencyKey) || '[]');
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  return calculateMastery(competencies, history);
};

export const getPlayerHighestMastery = (name: string): number => {
  const key = `player_${name}_highestMastery`;
  return parseInt(localStorage.getItem(key) || '0');
};