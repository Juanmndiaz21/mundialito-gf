import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Match, MatchResult, Phase, TournamentType } from "../domain/types";

const NEON_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_NEON_DATABASE_URL) || "";

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!sqlClient && NEON_URL) {
    try {
      sqlClient = neon(NEON_URL);
    } catch (e) {
      console.warn("Neon SQL client initialization warning:", e);
    }
  }
  return sqlClient;
}

export interface NeonLatestMatch {
  id: string;
  team1Name: string;
  team2Name: string;
  scoreTeam1: number;
  scoreTeam2: number;
  matchDate: string;
  category: "torneo" | "mixto" | "regular";
}

export interface UserStatsResult {
  userId: string;
  totalMatches: number;
  totalGoals: number;
  totalSpent: number;
  currentFeeling: string;
  filterApplied: string;
}

export async function fetchLatestMatchFromNeon(): Promise<NeonLatestMatch | null> {
  const sql = getSql();
  if (!sql) return null;

  try {
    const rows = await sql.query(
      `SELECT id, team1_name, team2_name, score_team1, score_team2, match_date, category
       FROM matches
       ORDER BY match_date DESC, created_at DESC
       LIMIT 1;`
    );

    if (!rows || rows.length === 0) return null;
    const r = rows[0] as Record<string, unknown>;

    return {
      id: String(r.id),
      team1Name: String(r.team1_name || "Equipo 1"),
      team2Name: String(r.team2_name || "Equipo 2"),
      scoreTeam1: Number(r.score_team1 ?? 0),
      scoreTeam2: Number(r.score_team2 ?? 0),
      matchDate: r.match_date ? new Date(String(r.match_date)).toISOString() : new Date().toISOString(),
      category: (r.category as "torneo" | "mixto" | "regular") || "torneo",
    };
  } catch (err) {
    console.warn("Error consultando ultimo partido en Neon, usando cache:", err);
    return null;
  }
}

export async function fetchMatchesFromNeon(): Promise<Match[] | null> {
  // 1. Intentar primero a través de la API Serverless segura (BFF)
  try {
    const res = await fetch("/api/matches", {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        return json.data as Match[];
      }
    }
  } catch {
    // Si la API Serverless no está activa en este entorno, continuar
  }

  const sql = getSql();
  if (!sql) return null;

  try {
    const rows = await sql.query(
      `SELECT id, tournament_type, match_number, match_date, cost, result,
              personal_goals, team_players, phase, notes, team1_name, team2_name,
              score_team1, score_team2
       FROM matches
       ORDER BY match_number ASC;`
    );

    if (!rows) return null;
    if (rows.length === 0) return [];

    // Cargar estadísticas individuales por jugador/usuario registradas en Neon
    const pmsRows = await sql.query(
      `SELECT pms.match_id, pms.goals_scored, u.linked_player_id
       FROM player_match_stats pms
       LEFT JOIN users u ON u.id = pms.user_id;`
    ).catch(() => []);

    const playerGoalsByMatch: Record<string, Record<string, number>> = {};
    if (Array.isArray(pmsRows)) {
      for (const p of pmsRows as Record<string, unknown>[]) {
        const mid = String(p.match_id);
        const lpid = String(p.linked_player_id || "").toLowerCase();
        const goals = Number(p.goals_scored || 0);
        if (!playerGoalsByMatch[mid]) {
          playerGoalsByMatch[mid] = {};
        }
        if (lpid) {
          playerGoalsByMatch[mid][lpid] = goals;
        }
      }
    }

    return rows.map((r: Record<string, unknown>) => {
      const matchId = String(r.id);
      const s1 = r.score_team1 !== null ? Number(r.score_team1) : null;
      const s2 = r.score_team2 !== null ? Number(r.score_team2) : null;
      const dateStr = r.match_date ? new Date(String(r.match_date)).toISOString().split("T")[0] : "2026-01-01";
      const pGoals = playerGoalsByMatch[matchId] || {};

      return {
        id: matchId,
        tournamentType: (r.tournament_type as TournamentType) || "mundialito",
        matchNumber: Number(r.match_number || 1),
        date: dateStr,
        cost: Number(r.cost || 0),
        result: (r.result as MatchResult) || "win",
        personalGoals: r.personal_goals !== null ? Number(r.personal_goals) : null,
        playerGoals: pGoals,
        teamPlayers: Array.isArray(r.team_players) ? (r.team_players as string[]) : [],
        phase: (r.phase as Phase) || null,
        notes: r.notes ? String(r.notes) : null,
        score: s1 !== null && s2 !== null ? { us: s1, them: s2 } : null,
      };
    });
  } catch (err) {
    console.warn("Error leyendo partidos desde Neon, usando persistencia local:", err);
    return null;
  }
}

export async function insertMatchToNeon(
  match: Match,
  extra?: { team1Name?: string; team2Name?: string; scoreTeam1?: number; scoreTeam2?: number; userId?: string }
): Promise<boolean> {
  // 1. Intentar guardar vía API Serverless segura (BFF)
  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match, extra }),
    });
    if (res.ok) {
      return true;
    }
  } catch {
    // Continuar al fallback de cliente directo
  }

  const sql = getSql();
  if (!sql) return false;

  try {
    const category = match.tournamentType === "mixto" ? "mixto" : "torneo";
    const team1 = extra?.team1Name || "NAVIKX";
    const team2 = extra?.team2Name || "CHALLENGER";
    const s1 = extra?.scoreTeam1 ?? (match.score?.us ?? (match.personalGoals || 0));
    const s2 = extra?.scoreTeam2 ?? (match.score?.them ?? (match.result === "win" ? 0 : 2));
    const userId = extra?.userId || "usr-signo";

    await sql.query(
      `INSERT INTO matches (
        id, tournament_type, category, match_number, match_date, cost, court_total_cost,
        result, personal_goals, team_players, phase, notes, team1_name, team2_name,
        score_team1, score_team2, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        match_date = EXCLUDED.match_date,
        cost = EXCLUDED.cost,
        result = EXCLUDED.result,
        personal_goals = EXCLUDED.personal_goals,
        team_players = EXCLUDED.team_players,
        score_team1 = EXCLUDED.score_team1,
        score_team2 = EXCLUDED.score_team2;`,
      [
        match.id,
        match.tournamentType,
        category,
        match.matchNumber,
        new Date(match.date).toISOString(),
        match.cost,
        match.cost * 5,
        match.result,
        match.personalGoals,
        match.teamPlayers,
        match.phase,
        match.notes,
        team1,
        team2,
        s1,
        s2,
        userId,
      ]
    );

    // Guardar estadísticas individuales de la persona activa
    await sql.query(
      `INSERT INTO player_match_stats (user_id, match_id, goals_scored, court_cost_share, feeling)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, match_id) DO UPDATE SET
         goals_scored = EXCLUDED.goals_scored,
         court_cost_share = EXCLUDED.court_cost_share;`,
      [userId, match.id, match.personalGoals || 0, match.cost, "en_racha"]
    );

    // Guardar estadísticas individuales de compañeros con goles especificados
    if (match.playerGoals) {
      for (const [playerId, goals] of Object.entries(match.playerGoals)) {
        await sql.query(
          `INSERT INTO player_match_stats (user_id, match_id, goals_scored, court_cost_share, feeling)
           SELECT u.id, $1, $2, $3, 'en_racha'
           FROM users u WHERE LOWER(u.linked_player_id) = LOWER($4)
           ON CONFLICT (user_id, match_id) DO UPDATE SET
             goals_scored = EXCLUDED.goals_scored;`,
          [match.id, goals, match.cost, playerId]
        ).catch(() => {});
      }
    }

    return true;
  } catch (err) {
    console.error("Error guardando partido en Neon:", err);
    return false;
  }
}

export async function deleteMatchFromNeon(matchId: string): Promise<boolean> {
  // 1. Intentar borrar vía API Serverless segura (BFF)
  try {
    const res = await fetch(`/api/matches?matchId=${encodeURIComponent(matchId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      return true;
    }
  } catch {
    // Continuar al fallback de cliente directo
  }

  const sql = getSql();
  if (!sql) return false;

  try {
    await sql.query(`DELETE FROM matches WHERE id = $1;`, [matchId]);
    return true;
  } catch (err) {
    console.error("Error eliminando partido de Neon:", err);
    return false;
  }
}

export async function clearAllMatchesFromNeon(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    await sql.query(`DELETE FROM player_match_stats;`);
    await sql.query(`DELETE FROM matches;`);
    return true;
  } catch (err) {
    console.error("Error reseteando partidos en Neon:", err);
    return false;
  }
}

export async function fetchUserStatsFromNeon(
  userId: string = "usr-signo",
  filterType: "all" | "torneo" | "mixto" = "all"
): Promise<UserStatsResult | null> {
  const sql = getSql();
  if (!sql) return null;

  try {
    let query = `
      SELECT
        COUNT(m.id)::int as total_matches,
        COALESCE(SUM(pms.goals_scored), COALESCE(SUM(m.personal_goals), 0))::int as total_goals,
        COALESCE(SUM(m.cost), 0)::numeric as total_spent,
        COALESCE(MAX(pms.feeling), 'en_racha') as current_feeling
      FROM matches m
      JOIN users u ON u.id = $1
      LEFT JOIN player_match_stats pms ON pms.match_id = m.id AND pms.user_id = $1
      WHERE u.linked_player_id = ANY(m.team_players)
    `;

    const params: unknown[] = [userId];

    if (filterType === "torneo") {
      query += ` AND (m.tournament_type = 'mundialito' OR m.category = 'torneo')`;
    } else if (filterType === "mixto") {
      query += ` AND (m.tournament_type = 'mixto' OR m.category = 'mixto')`;
    }

    const rows = await sql.query(query, params);
    if (!rows || rows.length === 0) {
      return {
        userId,
        filterApplied: filterType,
        totalMatches: 0,
        totalGoals: 0,
        totalSpent: 0,
        currentFeeling: "en_forma",
      };
    }

    const r = rows[0] as Record<string, unknown>;
    return {
      userId,
      filterApplied: filterType,
      totalMatches: Number(r.total_matches ?? 0),
      totalGoals: Number(r.total_goals ?? 0),
      totalSpent: Number(r.total_spent ?? 0),
      currentFeeling: String(r.current_feeling || "en_forma"),
    };
  } catch (err) {
    console.warn("Error consultando metricas de usuario en Neon:", err);
    return null;
  }
}
