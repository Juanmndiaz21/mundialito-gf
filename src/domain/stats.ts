import {
  type GlobalMetrics,
  type Match,
  type Player,
  type PlayerStat,
  type Scope,
  getPlayerGoalsInMatch,
} from "./types";

export const MIN_PJ_RANKING = 4;
const MIN_PJ_INVICTO = 2;

export function filterByScope(matches: Match[], scope: Scope): Match[] {
  if (scope === "all") return matches;
  return matches.filter((m) => m.tournamentType === scope);
}

export function assignBadges(stats: PlayerStat[]): void {
  for (const s of stats) {
    s.badges = [];
  }

  const eligible = stats.filter((s) => s.matchesPlayed >= MIN_PJ_RANKING);
  if (eligible.length > 0) {
    const byTalisman = [...eligible].sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
      return a.name.localeCompare(b.name, "es-AR");
    });
    const byMufa = [...eligible].sort((a, b) => {
      if (a.winRate !== b.winRate) return a.winRate - b.winRate;
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
      return a.name.localeCompare(b.name, "es-AR");
    });

    const talisman = byTalisman[0];
    const mufa = byMufa[0];
    talisman.badges.push("talisman");
    if (mufa.id !== talisman.id && mufa.winRate !== talisman.winRate) {
      mufa.badges.push("mufa");
    }
  }

  if (stats.length > 0) {
    const maxPj = Math.max(...stats.map((s) => s.matchesPlayed));
    if (maxPj >= 2) {
      for (const s of stats) {
        if (s.matchesPlayed === maxPj) {
          s.badges.push("inseparable");
        }
      }
    }
  }

  for (const s of stats) {
    if (s.winRate === 100 && s.matchesPlayed >= MIN_PJ_INVICTO) {
      s.badges.push("invicto");
    }
  }
}

export function computePlayerStats(
  matches: Match[],
  players: Player[],
  scope: Scope
): PlayerStat[] {
  const scoped = filterByScope(matches, scope);
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));
  const acc = new Map<string, { pj: number; w: number; d: number; l: number }>();

  for (const m of scoped) {
    const uniqueIds = Array.from(new Set(m.teamPlayers));
    for (const pid of uniqueIds) {
      const current = acc.get(pid) ?? { pj: 0, w: 0, d: 0, l: 0 };
      current.pj += 1;
      if (m.result === "win") current.w += 1;
      else if (m.result === "draw") current.d += 1;
      else current.l += 1;
      acc.set(pid, current);
    }
  }

  const stats: PlayerStat[] = [];
  for (const [pid, counts] of acc.entries()) {
    const player = playerMap.get(pid);
    stats.push({
      id: pid,
      name: player ? player.displayName : pid,
      scope,
      matchesPlayed: counts.pj,
      wins: counts.w,
      draws: counts.d,
      losses: counts.l,
      winRate: counts.pj > 0 ? (counts.w / counts.pj) * 100 : 0,
      badges: [],
    });
  }

  assignBadges(stats);

  stats.sort((a, b) => {
    if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return a.name.localeCompare(b.name, "es-AR");
  });

  return stats;
}

export function computePartnerStats(
  matches: Match[],
  players: Player[],
  scope: Scope,
  targetPlayerId: string
): PlayerStat[] {
  const userMatches = filterByScope(matches, scope).filter((m) =>
    m.teamPlayers.includes(targetPlayerId)
  );
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));
  const acc = new Map<string, { pj: number; w: number; d: number; l: number }>();

  for (const m of userMatches) {
    const uniqueIds = Array.from(new Set(m.teamPlayers)).filter(
      (id) => id !== targetPlayerId
    );
    for (const pid of uniqueIds) {
      const current = acc.get(pid) ?? { pj: 0, w: 0, d: 0, l: 0 };
      current.pj += 1;
      if (m.result === "win") current.w += 1;
      else if (m.result === "draw") current.d += 1;
      else current.l += 1;
      acc.set(pid, current);
    }
  }

  const stats: PlayerStat[] = [];
  for (const [pid, counts] of acc.entries()) {
    const player = playerMap.get(pid);
    stats.push({
      id: pid,
      name: player ? player.displayName : pid,
      scope,
      matchesPlayed: counts.pj,
      wins: counts.w,
      draws: counts.d,
      losses: counts.l,
      winRate: counts.pj > 0 ? (counts.w / counts.pj) * 100 : 0,
      badges: [],
    });
  }

  assignBadges(stats);

  stats.sort((a, b) => {
    if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return a.name.localeCompare(b.name, "es-AR");
  });

  return stats;
}

export function computeMetrics(
  matches: Match[],
  scope: Scope,
  targetPlayerId?: string | null
): GlobalMetrics {
  const scoped = filterByScope(matches, scope);
  if (scoped.length === 0) {
    return {
      scope,
      totalSpent: 0,
      totalMatches: 0,
      totalWins: 0,
      totalDraws: 0,
      totalLosses: 0,
      globalWinRate: 0,
      totalGoals: 0,
      matchesWithGoals: 0,
      avgGoalsPerMatch: 0,
      avgCost: 0,
      maxGoalsInMatch: 0,
      currentStreak: null,
    };
  }

  let totalSpent = 0;
  let totalWins = 0;
  let totalDraws = 0;
  let totalLosses = 0;
  let totalGoals = 0;
  let matchesWithGoals = 0;
  let maxGoalsInMatch = 0;

  for (const m of scoped) {
    totalSpent += m.cost;
    if (m.result === "win") totalWins += 1;
    else if (m.result === "draw") totalDraws += 1;
    else totalLosses += 1;

    const userGoals = getPlayerGoalsInMatch(m, targetPlayerId);

    if (userGoals !== null) {
      totalGoals += userGoals;
      matchesWithGoals += 1;
      if (userGoals > maxGoalsInMatch) {
        maxGoalsInMatch = userGoals;
      }
    }
  }

  const orderedDesc = [...scoped].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.matchNumber - a.matchNumber;
  });

  const firstResult = orderedDesc[0].result;
  let streakCount = 0;
  for (const m of orderedDesc) {
    if (m.result === firstResult) streakCount += 1;
    else break;
  }

  return {
    scope,
    totalSpent,
    totalMatches: scoped.length,
    totalWins,
    totalDraws,
    totalLosses,
    globalWinRate: (totalWins / scoped.length) * 100,
    totalGoals,
    matchesWithGoals,
    avgGoalsPerMatch: matchesWithGoals > 0 ? totalGoals / matchesWithGoals : 0,
    avgCost: totalSpent / scoped.length,
    maxGoalsInMatch,
    currentStreak: { result: firstResult, count: streakCount },
  };
}

