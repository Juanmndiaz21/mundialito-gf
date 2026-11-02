import type { Match, Player, PlayerStat } from "./types";
import { computePlayerStats } from "./stats";
import { playerDorsal } from "./format";

export type BalancingCriteria = "wins" | "winRate" | "random";

export interface TeamSquad {
  name: string;
  tag: "A" | "B";
  jerseyColor: string;
  jerseyName: string;
  players: PlayerStat[];
  totalWins: number;
  avgWinRate: number;
  totalMatches: number;
}

export interface TeamDraftResult {
  teamA: TeamSquad;
  teamB: TeamSquad;
  parityScore: number;
  diffWins: number;
  diffWinRate: number;
  criteria: BalancingCriteria;
  unselectedPlayers: PlayerStat[];
}

/**
 * Evaluates the parity between two teams.
 * Score from 0 to 100%, where 100% is perfect parity in wins and win rate.
 */
export function calculateParity(teamA: TeamSquad, teamB: TeamSquad): {
  parityScore: number;
  diffWins: number;
  diffWinRate: number;
} {
  const diffWins = Math.abs(teamA.totalWins - teamB.totalWins);
  const diffWinRate = Math.abs(teamA.avgWinRate - teamB.avgWinRate);

  const maxWins = Math.max(teamA.totalWins, teamB.totalWins, 1);
  const winParity = Math.max(0, 100 - (diffWins / maxWins) * 100);
  const wrParity = Math.max(0, 100 - diffWinRate);

  const parityScore = Number((winParity * 0.7 + wrParity * 0.3).toFixed(1));

  return { parityScore, diffWins, diffWinRate };
}

function buildSquad(
  players: PlayerStat[],
  name: string,
  tag: "A" | "B",
  jerseyColor: string,
  jerseyName: string
): TeamSquad {
  const totalWins = players.reduce((sum, p) => sum + p.wins, 0);
  const totalMatches = players.reduce((sum, p) => sum + p.matchesPlayed, 0);
  const avgWinRate =
    players.length > 0
      ? Number(
          (
            players.reduce((sum, p) => sum + p.winRate, 0) / players.length
          ).toFixed(1)
        )
      : 0;

  return {
    name,
    tag,
    jerseyColor,
    jerseyName,
    players,
    totalWins,
    avgWinRate,
    totalMatches,
  };
}

/**
 * Splits selected players into two teams.
 * If criteria === "random": purely random shuffle and split.
 * If criteria === "wins": finds the optimal combination minimizing win differences.
 */
export function generateTeamDraft(
  selectedPlayerIds: string[],
  allMatches: Match[],
  allPlayers: Player[],
  criteria: BalancingCriteria = "wins",
  salt: number = 0
): TeamDraftResult {
  const allStats = computePlayerStats(allMatches, allPlayers, "mundialito");
  const statsMap = new Map<string, PlayerStat>(allStats.map((s) => [s.id, s]));

  const activePlayers: PlayerStat[] = selectedPlayerIds
    .map((id) => {
      const existing = statsMap.get(id);
      if (existing) return existing;
      const p = allPlayers.find((item) => item.id === id);
      const fallback: PlayerStat = {
        id,
        name: p ? p.displayName : id,
        scope: "mundialito",
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        winRate: 0,
        badges: [],
      };
      return fallback;
    })
    .filter(Boolean);

  const unselectedPlayers = allStats.filter(
    (s) => !selectedPlayerIds.includes(s.id)
  );

  const n = activePlayers.length;
  if (n < 2) {
    const emptyA = buildSquad(activePlayers, "Equipo Blanco", "A", "#FFFFFF", "Camiseta Blanca");
    const emptyB = buildSquad([], "Equipo Naranja", "B", "#EA580C", "Pechera Naranja");
    return {
      teamA: emptyA,
      teamB: emptyB,
      parityScore: 100,
      diffWins: 0,
      diffWinRate: 0,
      criteria,
      unselectedPlayers,
    };
  }

  const halfSize = Math.floor(n / 2);

  if (criteria === "random") {
    const shuffled = [...activePlayers];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const teamAPlayers = shuffled.slice(0, halfSize);
    const teamBPlayers = shuffled.slice(halfSize);

    const squadA = buildSquad(teamAPlayers, "Equipo Blanco", "A", "#FFFFFF", "Camiseta Blanca");
    const squadB = buildSquad(teamBPlayers, "Equipo Naranja", "B", "#EA580C", "Pechera Naranja");
    const { parityScore, diffWins, diffWinRate } = calculateParity(squadA, squadB);

    return {
      teamA: squadA,
      teamB: squadB,
      parityScore,
      diffWins,
      diffWinRate,
      criteria: "random",
      unselectedPlayers,
    };
  }

  // Exact partition search for small sets (<= 16 players)
  // Find combination of size halfSize that minimizes diff in wins
  let bestA: PlayerStat[] = [];
  let bestB: PlayerStat[] = [];
  let minDiffWins = Infinity;
  let minDiffWr = Infinity;

  const totalWinsAll = activePlayers.reduce((acc, p) => acc + p.wins, 0);



  // Generate combinations
  function getCombinations(arr: PlayerStat[], k: number): PlayerStat[][] {
    const result: PlayerStat[][] = [];
    function backtrack(start: number, current: PlayerStat[]) {
      if (current.length === k) {
        result.push([...current]);
        return;
      }
      for (let i = start; i < arr.length; i += 1) {
        current.push(arr[i]);
        backtrack(i + 1, current);
        current.pop();
      }
    }
    backtrack(0, []);
    return result;
  }

  const combinations = getCombinations(activePlayers, halfSize);
  
  // Sort or shuffle slightly if salt > 0 to offer alternative optimal combinations
  if (salt > 0) {
    for (let i = combinations.length - 1; i > 0; i -= 1) {
      const j = (i * 37 + salt) % (i + 1);
      [combinations[i], combinations[j]] = [combinations[j], combinations[i]];
    }
  }

  for (const comboA of combinations) {
    const setA = new Set(comboA.map((p) => p.id));
    const comboB = activePlayers.filter((p) => !setA.has(p.id));

    const winsA = comboA.reduce((sum, p) => sum + p.wins, 0);
    const diff = Math.abs(winsA - (totalWinsAll - winsA));

    const wrA = comboA.reduce((sum, p) => sum + p.winRate, 0) / comboA.length;
    const wrB = comboB.reduce((sum, p) => sum + p.winRate, 0) / comboB.length;
    const diffWr = Math.abs(wrA - wrB);

    if (
      diff < minDiffWins ||
      (diff === minDiffWins && diffWr < minDiffWr)
    ) {
      minDiffWins = diff;
      minDiffWr = diffWr;
      bestA = comboA;
      bestB = comboB;

      if (diff === 0 && diffWr < 3) {
        break; // Excellent exact match
      }
    }
  }

  const squadA = buildSquad(bestA, "Equipo Blanco", "A", "#FFFFFF", "Camiseta Blanca");
  const squadB = buildSquad(bestB, "Equipo Naranja", "B", "#EA580C", "Pechera Naranja");
  const { parityScore, diffWins, diffWinRate } = calculateParity(squadA, squadB);

  return {
    teamA: squadA,
    teamB: squadB,
    parityScore,
    diffWins,
    diffWinRate,
    criteria: "wins",
    unselectedPlayers,
  };
}

/**
 * Format team sheet into a WhatsApp message ready to copy & paste.
 */
export function formatWhatsAppRoster(draft: TeamDraftResult, dateStr: string = "Esta semana"): string {
  const lineA = draft.teamA.players
    .map(
      (p) =>
        `• #${playerDorsal(p.id)} ${p.name} (${p.wins} PG · ${p.winRate.toFixed(1)}% WR)`
    )
    .join("\n");

  const lineB = draft.teamB.players
    .map(
      (p) =>
        `• #${playerDorsal(p.id)} ${p.name} (${p.wins} PG · ${p.winRate.toFixed(1)}% WR)`
    )
    .join("\n");

  return [
    `⚽ *SOCCER CLUB / FULBO 5 - EQUIPOS CONFIRMADOS* ⚽`,
    `📅 ${dateStr}`,
    `⚖️ Paridad: ${draft.parityScore}% (Diferencia: ${draft.diffWins} victorias)`,
    ``,
    `⚪ *EQUIPO BLANCO* (${draft.teamA.totalWins} PG · ${draft.teamA.avgWinRate}% prom)`,
    lineA,
    ``,
    `🟠 *EQUIPO NARANJA* (${draft.teamB.totalWins} PG · ${draft.teamB.avgWinRate}% prom)`,
    lineB,
    ``,
    `📋 Armado con Fulbo Tracker 2026`,
  ].join("\n");
}
