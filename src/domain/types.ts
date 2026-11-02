export type TournamentType = "mundialito" | "mixto";
export type MatchResult = "win" | "loss" | "draw";
export type Phase = "group" | "r16" | "qf" | "sf" | "final";
export type BadgeId = "talisman" | "inseparable" | "mufa" | "invicto";
export type Scope = TournamentType | "all";

export interface Score {
  us: number;
  them: number;
}

export interface Player {
  id: string;
  displayName: string;
  aliases: string[];
}

export interface Match {
  id: string;
  tournamentType: TournamentType;
  matchNumber: number;
  date: string;
  cost: number;
  result: MatchResult;
  personalGoals: number | null;
  teamPlayers: string[];
  phase: Phase | null;
  notes: string | null;
  score?: Score | null;
  playerGoals?: Record<string, number>;
}

export function getPlayerGoalsInMatch(
  match: Match,
  playerId?: string | null
): number | null {
  if (!playerId) {
    return match.personalGoals;
  }
  const normId = playerId.toLowerCase().trim();
  if (match.playerGoals && match.playerGoals[normId] !== undefined) {
    return match.playerGoals[normId];
  }
  if (match.teamPlayers.some((p) => p.toLowerCase().trim() === normId)) {
    return 0;
  }
  return 0;
}

export interface PlayerStat {
  id: string;
  name: string;
  scope: Scope;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  badges: BadgeId[];
}

export interface GlobalMetrics {
  scope: Scope;
  totalSpent: number;
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  globalWinRate: number;
  totalGoals: number;
  matchesWithGoals: number;
  avgGoalsPerMatch: number;
  avgCost: number;
  maxGoalsInMatch: number;
  currentStreak: { result: MatchResult; count: number } | null;
}

export interface Campaign {
  index: number;
  matchIds: string[];
  status: "active" | "eliminated" | "champion";
  reachedPhase: Phase;
  eliminatedAt: Phase | null;
  nextPhase: Phase | null;
  groupRecord: { wins: number; losses: number };
}

export interface PersistedState {
  schemaVersion: 1;
  players: Player[];
  matches: Match[];
  updatedAt: string;
}

