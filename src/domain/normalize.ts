import type { Player } from "./types";

export function normalizePlayerKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function slugifyPlayerId(raw: string): string {
  const base = normalizePlayerKey(raw)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "jugador";
}

function formatDisplayName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Jugador";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function resolvePlayerId(raw: string, players: Player[]): string | null {
  const key = normalizePlayerKey(raw);
  const rawLower = raw.trim().toLowerCase();
  if (!key) return null;

  for (const player of players) {
    if (player.id === key || player.id === rawLower) return player.id;
    if (normalizePlayerKey(player.displayName) === key) return player.id;
    for (const alias of player.aliases) {
      if (alias.toLowerCase() === rawLower || normalizePlayerKey(alias) === key) {
        return player.id;
      }
    }
  }
  return null;
}

export function findOrCreatePlayer(
  raw: string,
  players: Player[]
): { player: Player; created: boolean } {
  const existingId = resolvePlayerId(raw, players);
  if (existingId) {
    const found = players.find((p) => p.id === existingId)!;
    return { player: found, created: false };
  }
  const baseId = slugifyPlayerId(raw);
  let id = baseId;
  let suffix = 2;
  while (players.some((p) => p.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return {
    player: {
      id,
      displayName: formatDisplayName(raw),
      aliases: [],
    },
    created: true,
  };
}

