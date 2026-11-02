import { describe, expect, it } from "vitest";
import { SEED_PLAYERS } from "../domain/seed";
import { TEST_FIXTURE_MATCHES } from "./fixtures";
import { previewPhase, recomputePhases } from "../domain/campaigns";
import { computeMetrics, computePlayerStats } from "../domain/stats";
import { findOrCreatePlayer, resolvePlayerId } from "../domain/normalize";
import {
  computeChampionsLeaderboard,
  SEED_REGISTERED_USERS,
} from "../domain/leaderboard";
import {
  formatWhatsAppRoster,
  generateTeamDraft,
} from "../domain/teamBuilder";
import type { Match } from "../domain/types";

describe("Fulbo Tracker 2026 domain logic", () => {
  it("recomputePhases reproduces all 22 seed phases with 0 mismatches and 5 campaigns", () => {
    const { matches, campaigns } = recomputePhases(TEST_FIXTURE_MATCHES);
    const mun = matches.filter((m) => m.tournamentType === "mundialito");
    const seedMun = TEST_FIXTURE_MATCHES.filter((m) => m.tournamentType === "mundialito");

    expect(mun.map((m) => m.phase)).toEqual(seedMun.map((m) => m.phase));
    expect(campaigns).toHaveLength(5);
    expect(campaigns.map((c) => c.status)).toEqual([
      "eliminated",
      "eliminated",
      "eliminated",
      "eliminated",
      "active",
    ]);
    expect(campaigns.map((c) => c.eliminatedAt)).toEqual([
      "final",
      "r16",
      "sf",
      "r16",
      null,
    ]);
    expect(campaigns[4].nextPhase).toBe("r16");
    expect(previewPhase(TEST_FIXTURE_MATCHES)).toEqual({
      phase: "r16",
      campaignIndex: 5,
      groupRecord: { wins: 2, losses: 1 },
    });
  });

  it("computeMetrics matches verified Excel numbers for mundialito, mixto, and all", () => {
    const mun = computeMetrics(TEST_FIXTURE_MATCHES, "mundialito");
    expect(mun.totalMatches).toBe(22);
    expect(mun.totalWins).toBe(15);
    expect(mun.totalDraws).toBe(0);
    expect(mun.totalLosses).toBe(7);
    expect(Number(mun.globalWinRate.toFixed(2))).toBe(68.18);
    expect(mun.totalSpent).toBe(122850);
    expect(mun.totalGoals).toBe(56);
    expect(mun.matchesWithGoals).toBe(21);
    expect(Number(mun.avgGoalsPerMatch.toFixed(2))).toBe(2.67);
    expect(mun.maxGoalsInMatch).toBe(6);
    expect(mun.currentStreak).toEqual({ result: "win", count: 2 });

    const mix = computeMetrics(TEST_FIXTURE_MATCHES, "mixto");
    expect(mix.totalMatches).toBe(3);
    expect(mix.totalWins).toBe(1);
    expect(mix.totalDraws).toBe(1);
    expect(mix.totalLosses).toBe(1);
    expect(mix.totalSpent).toBe(17400);
    expect(mix.totalGoals).toBe(4);

    const all = computeMetrics(TEST_FIXTURE_MATCHES, "all");
    expect(all.totalMatches).toBe(25);
    expect(all.totalWins).toBe(16);
    expect(all.totalSpent).toBe(140250);
    expect(all.totalGoals).toBe(60);
  });

  it("computePlayerStats and assignBadges match expected synergy table", () => {
    const stats = computePlayerStats(TEST_FIXTURE_MATCHES, SEED_PLAYERS, "mundialito");
    const byId = Object.fromEntries(
      stats.map((s) => [s.id, [s.matchesPlayed, s.wins, s.badges]])
    );

    expect(byId.agustin).toEqual([12, 7, ["inseparable"]]);
    expect(byId.signo).toEqual([10, 9, ["talisman"]]);
    expect(byId.conra).toEqual([9, 7, []]);
    expect(byId.lauta).toEqual([6, 5, []]);
    expect(byId.ciorci).toEqual([5, 4, []]);
    expect(byId.andre).toEqual([5, 3, []]);
    expect(byId.row).toEqual([5, 3, []]);
    expect(byId.mati).toEqual([4, 3, []]);
    expect(byId.jp).toEqual([4, 2, []]);
    expect(byId.fede).toEqual([4, 1, ["mufa"]]);
    expect(byId.aiden).toEqual([3, 3, ["invicto"]]);
    expect(byId.oso).toEqual([2, 2, ["invicto"]]);

    const invictos = stats.filter((s) => s.badges.includes("invicto")).map((s) => s.id);
    expect(invictos).toEqual(["aiden", "oso"]);

    const mixStats = computePlayerStats(TEST_FIXTURE_MATCHES, SEED_PLAYERS, "mixto");
    const mixInsep = mixStats
      .filter((s) => s.badges.includes("inseparable"))
      .map((s) => s.id);
    expect(mixInsep).toEqual(["agustin", "row"]);
    expect(mixStats.some((s) => s.badges.includes("talisman"))).toBe(false);
    expect(mixStats.some((s) => s.badges.includes("mufa"))).toBe(false);
  });

  it("normalizes player aliases and accents without duplicating players", () => {
    expect(resolvePlayerId("Cioci ", SEED_PLAYERS)).toBe("ciorci");
    expect(resolvePlayerId("Mica❤", SEED_PLAYERS)).toBe("mica");
    expect(resolvePlayerId("AGUSTÍN", SEED_PLAYERS)).toBe("agustin");

    const existing = findOrCreatePlayer("  cioci ", SEED_PLAYERS);
    expect(existing.created).toBe(false);
    expect(existing.player.id).toBe("ciorci");
  });

  it("assigns phase r16 and matchNumber 23 when adding a mundialito win and advances nextPhase to qf", () => {
    const newMatch: Match = {
      id: "mun-023",
      tournamentType: "mundialito",
      matchNumber: 999,
      date: "2026-11-01",
      cost: 6000,
      result: "win",
      personalGoals: 2,
      teamPlayers: ["signo", "conra", "lauta", "agustin"],
      phase: null,
      notes: null,
      score: null,
    };
    const { matches, campaigns } = recomputePhases([...TEST_FIXTURE_MATCHES, newMatch]);
    const added = matches.find((m) => m.id === "mun-023")!;
    expect(added.matchNumber).toBe(23);
    expect(added.phase).toBe("r16");
    expect(campaigns[4].nextPhase).toBe("qf");
  });

  it("computeChampionsLeaderboard ranks historical + live 2026 champions and increments stars when a Final is won", () => {
    const { matches, campaigns } = recomputePhases(TEST_FIXTURE_MATCHES);
    const testHistoricalEditions = [
      {
        id: "hist-2024-c",
        title: "Copa Clausura 2024",
        period: "Nov 2024",
        finalScore: "7 - 5",
        championPlayerIds: ["signo", "conra", "lauta", "agustin"],
        finalistPlayerIds: ["ciorci", "jp", "row", "fede"],
        mvpPlayerId: "signo",
      },
      {
        id: "hist-2025-a",
        title: "Mundialito Apertura 2025",
        period: "Jun 2025",
        finalScore: "6 - 4",
        championPlayerIds: ["signo", "ciorci", "conra", "jp"],
        finalistPlayerIds: ["agustin", "lauta", "mati", "franco"],
        mvpPlayerId: "ciorci",
      },
      {
        id: "hist-2025-c",
        title: "Supercopa Nocturna 2025",
        period: "Dic 2025",
        finalScore: "8 - 6",
        championPlayerIds: ["lauta", "signo", "row", "mati"],
        finalistPlayerIds: ["conra", "agustin", "andre", "oso"],
        mvpPlayerId: "lauta",
      },
    ];

    const totalBoard = computeChampionsLeaderboard(
      matches,
      SEED_PLAYERS,
      campaigns,
      SEED_REGISTERED_USERS,
      "palmares_total",
      testHistoricalEditions
    );

    expect(totalBoard[0].playerId).toBe("signo");
    expect(totalBoard[0].totalTitles).toBe(3);
    expect(totalBoard[0].account?.handle).toBe("@signo");
    expect(totalBoard[1].playerId).toBe("conra");
    expect(totalBoard[1].totalTitles).toBe(2);

    // If Mundial 1 Final (mun-006) is won, players in Mundial 1 gain +1 live 2026 title
    const wonFinalInput = TEST_FIXTURE_MATCHES.map((m) =>
      m.id === "mun-006" ? { ...m, result: "win" as const } : m
    );
    const recomputedWon = recomputePhases(wonFinalInput);
    expect(recomputedWon.campaigns[0].status).toBe("champion");

    const board2026 = computeChampionsLeaderboard(
      recomputedWon.matches,
      SEED_PLAYERS,
      recomputedWon.campaigns,
      SEED_REGISTERED_USERS,
      "temporada_2026"
    );
    const signo2026 = board2026.find((e) => e.playerId === "signo")!;
    expect(signo2026.titles2026).toBe(1);
    expect(signo2026.totalTitles).toBe(1);
  });

  it("generateTeamDraft balances 10 players into two 5v5 teams minimizing win disparity", () => {
    // 10 frequent players from seed
    const top10 = [
      "agustin", // 7 wins
      "signo",   // 9 wins
      "conra",   // 7 wins
      "lauta",   // 5 wins
      "ciorci",  // 4 wins
      "andre",   // 3 wins
      "row",     // 3 wins
      "mati",    // 3 wins
      "jp",      // 2 wins
      "fede",    // 1 win
    ]; // total wins = 44, target each team = 22

    const draft = generateTeamDraft(top10, TEST_FIXTURE_MATCHES, SEED_PLAYERS, "wins", 0);
    expect(draft.teamA.players).toHaveLength(5);
    expect(draft.teamB.players).toHaveLength(5);
    expect(draft.diffWins).toBeLessThanOrEqual(1);
    expect(draft.parityScore).toBeGreaterThanOrEqual(90);

    const waText = formatWhatsAppRoster(draft);
    expect(waText).toContain("EQUIPOS CONFIRMADOS");
    expect(waText).toContain("EQUIPO BLANCO");
    expect(waText).toContain("EQUIPO NARANJA");
    expect(waText).toContain("Paridad");
    expect(waText).not.toContain("—"); // Zero em dashes rule
  });

  it("generateTeamDraft supports random criteria and splits players equally", () => {
    const top10 = [
      "agustin",
      "signo",
      "conra",
      "lauta",
      "ciorci",
      "andre",
      "row",
      "mati",
      "jp",
      "fede",
    ];
    const draft = generateTeamDraft(top10, TEST_FIXTURE_MATCHES, SEED_PLAYERS, "random");
    expect(draft.teamA.players).toHaveLength(5);
    expect(draft.teamB.players).toHaveLength(5);
    expect(draft.criteria).toBe("random");
  });
});

