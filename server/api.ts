import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

export const apiRouter = Router();

const NEON_CONN = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
const sql = NEON_CONN ? neon(NEON_CONN) : null;

export const CreateMatchSchema = z.object({
  team1Name: z.string().trim().min(2, "Nombre de Equipo 1 obligatorio").max(60),
  team2Name: z.string().trim().min(2, "Nombre de Equipo 2 obligatorio").max(60),
  scoreTeam1: z.number().int().min(0, "Goles no pueden ser negativos"),
  scoreTeam2: z.number().int().min(0, "Goles no pueden ser negativos"),
  matchDate: z.string().datetime({ message: "Fecha y hora en formato ISO-8601 requerida" }),
  category: z.enum(["torneo", "mixto", "regular"]),
  courtTotalCost: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
  userPersonalStats: z
    .object({
      goalsScored: z.number().int().min(0).default(0),
      courtCostShare: z.number().min(0).default(0),
      feeling: z.enum(["recuperacion", "cansado", "regular", "en_forma", "en_racha"]).default("en_forma"),
    })
    .optional(),
});

export const UserStatsQuerySchema = z.object({
  type: z.enum(["torneo", "mixto", "regular", "all"]).optional().default("all"),
});

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autorización requerido en cabecera Bearer" });
  }

  const token = authHeader.split(" ")[1];
  try {
    if (!token || token === "invalid") {
      throw new Error("Token inválido");
    }
    req.user = {
      id: "usr-signo",
      email: "signo@fulbo2026.club",
      displayName: "Signo",
    };
    next();
  } catch {
    return res.status(401).json({ error: "Sesión expirada o token inválido" });
  }
};

apiRouter.get("/matches/latest", async (_req: Request, res: Response) => {
  try {
    if (!sql) {
      return res.status(500).json({ error: "Base de datos Neon no configurada" });
    }

    const rows = await sql.query(
      `SELECT id, team1_name, team2_name, score_team1, score_team2, match_date, category
       FROM matches
       ORDER BY match_date DESC, created_at DESC
       LIMIT 1;`
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({ data: null });
    }

    const r = rows[0] as Record<string, unknown>;
    const latestMatch = {
      id: String(r.id),
      team1Name: String(r.team1_name),
      team2Name: String(r.team2_name),
      scoreTeam1: Number(r.score_team1),
      scoreTeam2: Number(r.score_team2),
      matchDate: r.match_date ? new Date(String(r.match_date)).toISOString() : new Date().toISOString(),
      category: String(r.category),
    };

    return res.status(200).json({ data: latestMatch });
  } catch (error) {
    console.error("Error en GET /api/matches/latest con Neon:", error);
    return res.status(500).json({ error: "Error al recuperar el ultimo partido desde Neon" });
  }
});

/**
 * POST /api/matches
 * Creacion de nuevo partido directamente en Neon PostgreSQL
 */
apiRouter.post("/matches", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!sql) {
      return res.status(500).json({ error: "Base de datos Neon no configurada" });
    }

    const parseResult = CreateMatchSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Datos de partido invalidos",
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const matchData = parseResult.data;
    const matchId = `mat-${Date.now()}`;
    const userId = req.user?.id || "usr-signo";

    await sql.query(
      `INSERT INTO matches (
        id, team1_name, team2_name, score_team1, score_team2, match_date,
        category, court_total_cost, notes, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        matchId,
        matchData.team1Name,
        matchData.team2Name,
        matchData.scoreTeam1,
        matchData.scoreTeam2,
        matchData.matchDate,
        matchData.category,
        matchData.courtTotalCost,
        matchData.notes || null,
        userId,
      ]
    );

    if (matchData.userPersonalStats) {
      await sql.query(
        `INSERT INTO player_match_stats (
          user_id, match_id, goals_scored, court_cost_share, feeling
        ) VALUES ($1, $2, $3, $4, $5);`,
        [
          userId,
          matchId,
          matchData.userPersonalStats.goalsScored,
          matchData.userPersonalStats.courtCostShare,
          matchData.userPersonalStats.feeling,
        ]
      );
    }

    return res.status(201).json({
      data: {
        id: matchId,
        ...matchData,
        createdByUserId: userId,
      },
      message: "Partido registrado exitosamente en Neon PostgreSQL",
    });
  } catch (error) {
    console.error("Error en POST /api/matches con Neon:", error);
    return res.status(500).json({ error: "Error al registrar el partido en Neon" });
  }
});

/**
 * GET /api/user/stats
 * Metricas agregadas del usuario en sesion directamente desde Neon
 */
apiRouter.get("/user/stats", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!sql) {
      return res.status(500).json({ error: "Base de datos Neon no configurada" });
    }

    const queryResult = UserStatsQuerySchema.safeParse(req.query);
    const filterType = queryResult.success ? queryResult.data.type : "all";
    const userId = req.user?.id || "usr-signo";

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
      query += ` AND (m.category = 'torneo' OR m.tournament_type = 'mundialito')`;
    } else if (filterType === "mixto") {
      query += ` AND (m.category = 'mixto' OR m.tournament_type = 'mixto')`;
    }

    const rows = await sql.query(query, params);
    const r = rows && rows.length > 0 ? (rows[0] as Record<string, unknown>) : {};

    const stats = {
      userId,
      filterApplied: filterType,
      totalMatches: Number(r.total_matches ?? 0),
      totalGoals: Number(r.total_goals ?? 0),
      totalSpent: Number(r.total_spent ?? 0),
      currentFeeling: String(r.current_feeling || "en_racha"),
      lastFeelingDate: new Date().toISOString(),
    };

    return res.status(200).json({ data: stats });
  } catch (error) {
    console.error("Error en GET /api/user/stats con Neon:", error);
    return res.status(500).json({ error: "Error al calcular estadisticas personales en Neon" });
  }
});


