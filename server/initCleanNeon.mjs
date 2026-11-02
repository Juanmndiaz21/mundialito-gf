import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in .env");
  process.exit(1);
}

const sql = neon(connectionString);

async function initCleanNeon() {
  console.log("Conectando a Neon...");

  // 1. Crear tablas si no existen
  await sql.query(`
    CREATE TABLE IF NOT EXISTS players (
      id VARCHAR(100) PRIMARY KEY,
      display_name VARCHAR(100) NOT NULL,
      aliases TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) DEFAULT '',
      display_name VARCHAR(100) NOT NULL,
      handle VARCHAR(50) UNIQUE NOT NULL,
      linked_player_id VARCHAR(100),
      dorsal SMALLINT DEFAULT 10,
      position VARCHAR(50) DEFAULT 'todoterreno',
      foot VARCHAR(20) DEFAULT 'diestro',
      auth_status VARCHAR(50) DEFAULT 'magic_link_ready',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id VARCHAR(100) PRIMARY KEY,
      tournament_type VARCHAR(50) NOT NULL DEFAULT 'mundialito',
      category VARCHAR(50) NOT NULL DEFAULT 'torneo',
      match_number INT NOT NULL DEFAULT 1,
      match_date TIMESTAMPTZ NOT NULL,
      cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      court_total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      result VARCHAR(20) NOT NULL DEFAULT 'win',
      personal_goals SMALLINT DEFAULT 0,
      team_players TEXT[] NOT NULL DEFAULT '{}',
      phase VARCHAR(50),
      notes TEXT,
      team1_name VARCHAR(100) NOT NULL DEFAULT 'EQUIPO TITULAR',
      team2_name VARCHAR(100) NOT NULL DEFAULT 'EQUIPO RIVAL',
      score_team1 SMALLINT NOT NULL DEFAULT 0,
      score_team2 SMALLINT NOT NULL DEFAULT 0,
      created_by_user_id VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS player_match_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(100) NOT NULL,
      match_id VARCHAR(100) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      goals_scored SMALLINT NOT NULL DEFAULT 0 CHECK (goals_scored >= 0),
      court_cost_share NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (court_cost_share >= 0),
      feeling VARCHAR(50) DEFAULT 'en_forma',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_user_match UNIQUE (user_id, match_id)
    );
  `);

  await sql.query(`CREATE INDEX IF NOT EXISTS idx_matches_date_desc ON matches (match_date DESC, created_at DESC);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches (tournament_type);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_player_match_stats_user ON player_match_stats (user_id);`);

  // 2. Vaciar partidos y estadisticas de partidos
  console.log("Limpiando estadísticas y partidos de Neon...");
  await sql.query(`DELETE FROM player_match_stats;`);
  await sql.query(`DELETE FROM matches;`);

  // 3. Sembrar jugadores base si no existen
  const SEED_PLAYERS = [
    { id: "aguado", displayName: "Aguado", aliases: [] },
    { id: "agustin", displayName: "Agustín", aliases: ["agustín"] },
    { id: "aiden", displayName: "Aiden", aliases: [] },
    { id: "alesio", displayName: "Alesio", aliases: [] },
    { id: "andre", displayName: "Andre", aliases: [] },
    { id: "cande", displayName: "Cande", aliases: [] },
    { id: "ciorci", displayName: "Ciorci", aliases: ["cioci"] },
    { id: "clara", displayName: "Clara", aliases: [] },
    { id: "conra", displayName: "Conra", aliases: [] },
    { id: "fede", displayName: "Fede", aliases: [] },
    { id: "franco", displayName: "Franco", aliases: [] },
    { id: "juan", displayName: "Juan", aliases: [] },
    { id: "lauta", displayName: "Lauta", aliases: [] },
    { id: "lucas", displayName: "Lucas", aliases: [] },
    { id: "marcos", displayName: "Marcos", aliases: [] },
    { id: "mati", displayName: "Mati", aliases: [] },
    { id: "maxi", displayName: "Maxi", aliases: [] },
    { id: "nacho", displayName: "Nacho", aliases: [] },
    { id: "nico", displayName: "Nico", aliases: [] },
    { id: "pepe", displayName: "Pepe", aliases: [] },
    { id: "rama", displayName: "Rama", aliases: [] },
    { id: "rodrigo", displayName: "Rodrigo", aliases: [] },
    { id: "row", displayName: "Row", aliases: [] },
    { id: "santino", displayName: "Santino", aliases: [] },
    { id: "signo", displayName: "Signo", aliases: [] },
    { id: "thiago", displayName: "Thiago", aliases: [] },
    { id: "tobi", displayName: "Tobi", aliases: [] },
    { id: "valen", displayName: "Valen", aliases: [] },
    { id: "vicente", displayName: "Vicente", aliases: [] },
    { id: "yo", displayName: "Yo", aliases: [] }
  ];

  for (const p of SEED_PLAYERS) {
    await sql.query(
      `INSERT INTO players (id, display_name, aliases)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;`,
      [p.id, p.displayName, p.aliases]
    );
  }

  // 4. Sembrar usuarios iniciales
  const SEED_USERS = [
    { id: "usr-signo", email: "signo@fulbo.club", displayName: "Signo", handle: "@signo", playerId: "signo", dorsal: 10, position: "creador" },
    { id: "usr-conra", email: "conra@fulbo.club", displayName: "Conra", handle: "@conra", playerId: "conra", dorsal: 5, position: "todoterreno" },
    { id: "usr-lauta", email: "lauta@fulbo.club", displayName: "Lauta", handle: "@lauta", playerId: "lauta", dorsal: 7, position: "definidor" },
    { id: "usr-agustin", email: "agustin@fulbo.club", displayName: "Agustín", handle: "@agustin", playerId: "agustin", dorsal: 8, position: "creador" },
    { id: "usr-row", email: "row@fulbo.club", displayName: "Row", handle: "@row", playerId: "row", dorsal: 64, position: "arquero" },
    { id: "usr-aguado", email: "aguado@fulbo.club", displayName: "Aguado", handle: "@aguado", playerId: "aguado", dorsal: 18, position: "defensa" },
    { id: "usr-aiden", email: "aiden@fulbo.club", displayName: "Aiden", handle: "@aiden", playerId: "aiden", dorsal: 19, position: "todoterreno" },
    { id: "usr-alesio", email: "alesio@fulbo.club", displayName: "Alesio", handle: "@alesio", playerId: "alesio", dorsal: 49, position: "creador" },
    { id: "usr-andre", email: "andre@fulbo.club", displayName: "Andre", handle: "@andre", playerId: "andre", dorsal: 34, position: "definidor" },
  ];

  for (const u of SEED_USERS) {
    await sql.query(
      `INSERT INTO users (id, email, display_name, handle, linked_player_id, dorsal, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         handle = EXCLUDED.handle,
         linked_player_id = EXCLUDED.linked_player_id,
         dorsal = EXCLUDED.dorsal;`,
      [u.id, u.email, u.displayName, u.handle, u.playerId, u.dorsal, u.position]
    );
  }

  // 5. Verificar estado final
  const matchCount = await sql.query(`SELECT COUNT(*)::int as count FROM matches;`);
  const statsCount = await sql.query(`SELECT COUNT(*)::int as count FROM player_match_stats;`);
  const playersCount = await sql.query(`SELECT COUNT(*)::int as count FROM players;`);
  const usersCount = await sql.query(`SELECT COUNT(*)::int as count FROM users;`);

  console.log("-----------------------------------------");
  console.log("Estado de Neon PostgreSQL tras el reset:");
  console.log(`- Partidos (matches): ${matchCount[0].count}`);
  console.log(`- Estadísticas de partidos (player_match_stats): ${statsCount[0].count}`);
  console.log(`- Jugadores en padrón (players): ${playersCount[0].count}`);
  console.log(`- Usuarios registrados (users): ${usersCount[0].count}`);
  console.log("-----------------------------------------");
  console.log("Base de datos limpia y lista para registrar nuevos cotejos.");
}

initCleanNeon().catch((err) => {
  console.error("Error inicializando Neon limpio:", err);
  process.exit(1);
});

