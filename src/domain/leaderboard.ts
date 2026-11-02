import type { BadgeId, Campaign, Match, Player } from "./types";
import { computePlayerStats } from "./stats";
import { playerDorsal } from "./format";

export type PlayerPosition =
  | "arquero"
  | "defensa"
  | "mediocampo"
  | "delantero"
  | "todoterreno";

export type PreferredFoot = "diestro" | "zurdo" | "ambidiestro";

export type LeaderboardMode = "palmares_total" | "temporada_2026";

export interface RegisteredUser {
  userId: string;
  email: string;
  handle: string;
  displayName: string;
  linkedPlayerId: string;
  dorsal: number;
  position: PlayerPosition;
  foot: PreferredFoot;
  authStatus: "verified_local" | "magic_link_ready";
  createdAt: string;
}

export interface AuthRegistryState {
  schemaVersion: 1;
  activeUserId: string | null;
  users: RegisteredUser[];
}

export interface HistoricalEdition {
  id: string;
  title: string;
  period: string;
  finalScore: string;
  championPlayerIds: string[];
  finalistPlayerIds: string[];
  mvpPlayerId: string;
}

export interface ChampionLeaderboardEntry {
  playerId: string;
  name: string;
  dorsal: string;
  totalTitles: number;
  titles2026: number;
  historicalTitles: number;
  finalsReached: number;
  semifinalsReached: number;
  knockoutWins: number;
  mundialitoWins: number;
  mundialitoPlayed: number;
  winRate: number;
  badges: BadgeId[];
  editionsWon: string[];
  account: RegisteredUser | null;
}

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  arquero: "Arquero",
  defensa: "Defensor",
  mediocampo: "Mediocampo",
  delantero: "Delantero",
  todoterreno: "Todoterreno",
};

export const FOOT_LABELS: Record<PreferredFoot, string> = {
  diestro: "Diestro",
  zurdo: "Zurdo",
  ambidiestro: "Ambidiestro",
};

export const HISTORICAL_EDITIONS: HistoricalEdition[] = [];

export const SEED_REGISTERED_USERS: RegisteredUser[] = [
  {
    userId: "usr-signo",
    email: "signo@fulbo2026.club",
    handle: "@signo",
    displayName: "Signo",
    linkedPlayerId: "signo",
    dorsal: 10,
    position: "mediocampo",
    foot: "diestro",
    authStatus: "magic_link_ready",
    createdAt: "2026-01-15T20:00:00.000Z",
  },
  {
    userId: "usr-conra",
    email: "conra@fulbo2026.club",
    handle: "@conra",
    displayName: "Conra",
    linkedPlayerId: "conra",
    dorsal: 5,
    position: "todoterreno",
    foot: "diestro",
    authStatus: "magic_link_ready",
    createdAt: "2026-01-16T20:00:00.000Z",
  },
  {
    userId: "usr-lauta",
    email: "lauta@fulbo2026.club",
    handle: "@lauta",
    displayName: "Lauta",
    linkedPlayerId: "lauta",
    dorsal: 7,
    position: "delantero",
    foot: "zurdo",
    authStatus: "magic_link_ready",
    createdAt: "2026-01-17T20:00:00.000Z",
  },
  {
    userId: "usr-agustin",
    email: "agustin@fulbo2026.club",
    handle: "@agustin",
    displayName: "Agustín",
    linkedPlayerId: "agustin",
    dorsal: 8,
    position: "defensa",
    foot: "diestro",
    authStatus: "magic_link_ready",
    createdAt: "2026-01-18T20:00:00.000Z",
  },
];

const ACCOUNTS_STORAGE_KEY = "fulbo-tracker:accounts:v1";

export function createSeedAccountsState(): AuthRegistryState {
  return {
    schemaVersion: 1,
    activeUserId: "usr-signo",
    users: SEED_REGISTERED_USERS.map((u) => ({ ...u })),
  };
}

export function loadAccountsState(): AuthRegistryState {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      const seed = createSeedAccountsState();
      saveAccountsState(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<AuthRegistryState>;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.users)) {
      return createSeedAccountsState();
    }
    return {
      schemaVersion: 1,
      activeUserId:
        typeof parsed.activeUserId === "string" ? parsed.activeUserId : null,
      users: parsed.users,
    };
  } catch {
    return createSeedAccountsState();
  }
}

export function saveAccountsState(state: AuthRegistryState): void {
  try {
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors for preview identity registry.
  }
}

export function computeChampionsLeaderboard(
  matches: Match[],
  players: Player[],
  campaigns: Campaign[],
  registeredUsers: RegisteredUser[],
  mode: LeaderboardMode = "palmares_total",
  historicalEditions: HistoricalEdition[] = HISTORICAL_EDITIONS
): ChampionLeaderboardEntry[] {
  const mundialitoStats = computePlayerStats(matches, players, "mundialito");
  const statsById = new Map(mundialitoStats.map((s) => [s.id, s]));
  const usersByPlayerId = new Map(
    registeredUsers.map((u) => [u.linkedPlayerId, u])
  );
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const entries: ChampionLeaderboardEntry[] = [];

  for (const player of players) {
    const pStat = statsById.get(player.id);
    const mundialitoPlayed = pStat?.matchesPlayed ?? 0;
    const mundialitoWins = pStat?.wins ?? 0;
    const winRate = pStat?.winRate ?? 0;
    const badges = pStat?.badges ?? [];

    let titles2026 = 0;
    let finals2026 = 0;
    let semifinals2026 = 0;
    const editionsWon: string[] = [];

    for (const camp of campaigns) {
      const campMatches = camp.matchIds
        .map((id) => matchById.get(id))
        .filter((m): m is Match => Boolean(m));
      const participated = campMatches.some((m) =>
        m.teamPlayers.includes(player.id)
      );
      if (!participated) continue;

      if (camp.status === "champion") {
        titles2026 += 1;
        editionsWon.push(`Mundial ${camp.index} (2026)`);
      }
      if (camp.reachedPhase === "final") {
        finals2026 += 1;
      }
      if (camp.reachedPhase === "sf" || camp.reachedPhase === "final") {
        semifinals2026 += 1;
      }
    }

    let historicalTitles = 0;
    let historicalFinals = 0;

    if (mode === "palmares_total") {
      for (const ed of historicalEditions) {
        if (ed.championPlayerIds.includes(player.id)) {
          historicalTitles += 1;
          editionsWon.unshift(ed.title);
        } else if (ed.finalistPlayerIds.includes(player.id)) {
          historicalFinals += 1;
        }
      }
    }

    let knockoutWins = 0;
    for (const m of matches) {
      if (
        m.tournamentType === "mundialito" &&
        m.result === "win" &&
        m.phase !== null &&
        m.phase !== "group" &&
        m.teamPlayers.includes(player.id)
      ) {
        knockoutWins += 1;
      }
    }

    const totalTitles =
      mode === "palmares_total" ? historicalTitles + titles2026 : titles2026;
    const finalsReached =
      mode === "palmares_total"
        ? historicalTitles + historicalFinals + finals2026
        : finals2026;

    const account = usersByPlayerId.get(player.id) ?? null;
    const dorsalStr = account
      ? `#${String(account.dorsal).padStart(2, "0")}`
      : `#${playerDorsal(player.id)}`;

    if (
      mundialitoPlayed === 0 &&
      totalTitles === 0 &&
      finalsReached === 0 &&
      !account
    ) {
      continue;
    }

    entries.push({
      playerId: player.id,
      name: player.displayName,
      dorsal: dorsalStr,
      totalTitles,
      titles2026,
      historicalTitles,
      finalsReached,
      semifinalsReached: semifinals2026,
      knockoutWins,
      mundialitoWins,
      mundialitoPlayed,
      winRate,
      badges,
      editionsWon,
      account,
    });
  }

  entries.sort((a, b) => {
    if (b.totalTitles !== a.totalTitles) return b.totalTitles - a.totalTitles;
    if (b.titles2026 !== a.titles2026) return b.titles2026 - a.titles2026;
    if (b.finalsReached !== a.finalsReached)
      return b.finalsReached - a.finalsReached;
    if (b.knockoutWins !== a.knockoutWins)
      return b.knockoutWins - a.knockoutWins;
    if (b.mundialitoWins !== a.mundialitoWins)
      return b.mundialitoWins - a.mundialitoWins;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return a.name.localeCompare(b.name, "es-AR");
  });

  return entries;
}
