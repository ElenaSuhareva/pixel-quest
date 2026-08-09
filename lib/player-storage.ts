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

  try {
    return JSON.parse(savedPlayer) as PlayerProfile;
  } catch {
    return null;
  }
}

export function addPlayerDiamonds(amount: number): PlayerProfile | null {
  const player = getPlayer();
  if (!player) return null;

  const nextPlayer: PlayerProfile = {
    ...player,
    diamonds: Math.max(0, (player.diamonds ?? 0) + amount),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlayer));
  return nextPlayer;
}
