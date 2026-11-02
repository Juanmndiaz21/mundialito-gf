import { neon } from "@neondatabase/serverless";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.VITE_NEON_DATABASE_URL;

  if (!dbUrl) {
    return res.status(503).json({ error: "Base de datos no configurada en el servidor" });
  }

  const sql = neon(dbUrl);

  try {
    if (req.method === "GET") {
      const rows = await sql.query(
        `SELECT id, tournament_type, match_number, match_date, cost, result,
                personal_goals, team_players, phase, notes, team1_name, team2_name,
                score_team1, score_team2
         FROM matches
         ORDER BY match_number ASC;`
      );

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

      const matches = (rows || []).map((r: Record<string, unknown>) => {
        const matchId = String(r.id);
        const s1 = r.score_team1 !== null ? Number(r.score_team1) : null;
        const s2 = r.score_team2 !== null ? Number(r.score_team2) : null;
        const dateStr = r.match_date
          ? new Date(String(r.match_date)).toISOString().split("T")[0]
          : "2026-01-01";

        return {
          id: matchId,
          tournamentType: r.tournament_type || "mundialito",
          matchNumber: Number(r.match_number || 1),
          date: dateStr,
          cost: Number(r.cost || 0),
          result: r.result || "win",
          personalGoals: r.personal_goals !== null ? Number(r.personal_goals) : null,
          playerGoals: playerGoalsByMatch[matchId] || {},
          teamPlayers: Array.isArray(r.team_players) ? r.team_players : [],
          phase: r.phase || null,
          notes: r.notes ? String(r.notes) : null,
          score: s1 !== null && s2 !== null ? { us: s1, them: s2 } : null,
        };
      });

      return res.status(200).json({ ok: true, data: matches });
    }

    if (req.method === "POST") {
      const { match, extra } = req.body || {};
      if (!match || !match.id) {
        return res.status(400).json({ error: "Datos de partido incompletos" });
      }

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

      await sql.query(
        `INSERT INTO player_match_stats (user_id, match_id, goals_scored, court_cost_share, feeling)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, match_id) DO UPDATE SET
           goals_scored = EXCLUDED.goals_scored,
           court_cost_share = EXCLUDED.court_cost_share;`,
        [userId, match.id, match.personalGoals || 0, match.cost, "en_racha"]
      );

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

      return res.status(200).json({ ok: true, id: match.id });
    }

    if (req.method === "DELETE") {
      const { matchId } = req.query || req.body || {};
      if (!matchId) {
        return res.status(400).json({ error: "matchId es requerido" });
      }

      await sql.query(`DELETE FROM matches WHERE id = $1;`, [matchId]);
      return res.status(200).json({ ok: true, deleted: matchId });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (error) {
    console.error("Error en API /api/matches:", error);
    return res.status(500).json({ error: "Error procesando solicitud en el servidor" });
  }
}

