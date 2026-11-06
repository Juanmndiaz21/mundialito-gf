import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import fs from 'fs';

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in .env");
  process.exit(1);
}

const sql = neon(connectionString);

async function applyDatosFutbol() {
  console.log("Conectando a Neon para aplicar datos-futbol.json...");

  const raw = fs.readFileSync('datos-futbol.json', 'utf8');
  const data = jsonParseSafe(raw);
  const matches = data.formatoFulboTracker.matches;

  console.log(`Cargando ${matches.length} partidos en Neon...`);

  // 1. Limpiar partidos y stats anteriores
  await sql.query('DELETE FROM player_match_stats;');
  await sql.query('DELETE FROM matches;');

  // 2. Insertar los 25 partidos
  for (const m of matches) {
    const category = m.tournamentType === 'mixto' ? 'mixto' : 'torneo';
    const s1 = m.score ? m.score.us : (m.personalGoals || 0);
    const s2 = m.score ? m.score.them : (m.result === 'win' ? 0 : 2);

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
        m.id,
        m.tournamentType,
        category,
        m.matchNumber,
        new Date(m.date).toISOString(),
        m.cost,
        m.cost * 5,
        m.result,
        m.personalGoals,
        m.teamPlayers,
        m.phase,
        m.notes,
        "NAVIKX",
        "CHALLENGER",
        s1,
        s2,
        "usr-signo"
      ]
    );

    // Insertar stats en player_match_stats para el usuario autor (Signo)
    if (m.personalGoals !== null) {
      await sql.query(
        `INSERT INTO player_match_stats (user_id, match_id, goals_scored, court_cost_share, feeling)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, match_id) DO UPDATE SET
           goals_scored = EXCLUDED.goals_scored,
           court_cost_share = EXCLUDED.court_cost_share;`,
        ["usr-signo", m.id, m.personalGoals, m.cost, "en_racha"]
      );
    }
  }

  const mCount = await sql.query('SELECT count(*) FROM matches;');
  const pCount = await sql.query('SELECT count(*) FROM player_match_stats;');

  console.log(`Partidos cargados en Neon: ${mCount[0].count}`);
  console.log(`Registros player_match_stats cargados en Neon: ${pCount[0].count}`);
  console.log("Aplicación de datos a Neon finalizada con éxito.");
}

function jsonParseSafe(str) {
  return JSON.parse(str);
}

applyDatosFutbol().catch(err => {
  console.error("Error aplicando datos a Neon:", err);
  process.exit(1);
});
