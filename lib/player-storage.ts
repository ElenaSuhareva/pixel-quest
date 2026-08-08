export type PlayerProfile = {
  name: string;
  diamonds: number;
};

const STORAGE_KEY = "pixelQuest.player";

export function createPlayer(name: string): PlayerProfile {
  const player = { name: name.trim(), diamonds: 0 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  return player;
}

export function getPlayer(): PlayerProfile | null {
  const savedPlayer = localStorage.getItem(STORAGE_KEY);
  if (!savedPlayer) return null;
  return JSON.parse(savedPlayer) as PlayerProfile;
}
