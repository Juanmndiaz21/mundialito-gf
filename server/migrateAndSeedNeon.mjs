import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in .env");
  process.exit(1);
}

const sql = neon(connectionString);

async function migrateAndSeed() {
  console.log("Migrating Neon PostgreSQL schema...");

  await sql`DROP TABLE IF EXISTS player_match_stats CASCADE;`;
  await sql`DROP TABLE IF EXISTS matches CASCADE;`;
  await sql`DROP TABLE IF EXISTS users CASCADE;`;
  await sql`DROP TABLE IF EXISTS players CASCADE;`;

  console.log("Creating players table...");
  await sql`
    CREATE TABLE players (
      id VARCHAR(100) PRIMARY KEY,
      display_name VARCHAR(100) NOT NULL,
      aliases TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log("Creating users table...");
  await sql`
    CREATE TABLE users (
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
  `;

  console.log("Creating matches table...");
  await sql`
    CREATE TABLE matches (
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
      team1_name VARCHAR(100) NOT NULL DEFAULT 'NAVIKX',
      team2_name VARCHAR(100) NOT NULL DEFAULT 'CHALLENGER',
      score_team1 SMALLINT NOT NULL DEFAULT 0,
      score_team2 SMALLINT NOT NULL DEFAULT 0,
      created_by_user_id VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log("Creating player_match_stats table...");
  await sql`
    CREATE TABLE player_match_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(100) NOT NULL,
      match_id VARCHAR(100) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      goals_scored SMALLINT NOT NULL DEFAULT 0 CHECK (goals_scored >= 0),
      court_cost_share NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (court_cost_share >= 0),
      feeling VARCHAR(50) DEFAULT 'en_forma',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_user_match UNIQUE (user_id, match_id)
    );
  `;

  await sql`CREATE INDEX idx_matches_date_desc ON matches (match_date DESC, created_at DESC);`;
  await sql`CREATE INDEX idx_matches_tournament ON matches (tournament_type);`;
  await sql`CREATE INDEX idx_player_match_stats_user ON player_match_stats (user_id);`;

  console.log("Seeding players into Neon...");
  const SEED_PLAYERS = [
    { id: "aguado", displayName: "Aguado", aliases: [] },
    { id: "agustin", displayName: "Agustín", aliases: ["agustín"] },
    { id: "aiden", displayName: "Aiden", aliases: [] },
    { id: "alesio", displayName: "Alesio", aliases: [] },
    { id: "andre", displayName: "Andre", aliases: [] },
    { id: "cande", displayName: "Cande", aliases: [] },
    { id: "ciorci", displayName: "Ciorci", aliases: ["cioci"] },
    { id: "clara", displayName: "Clara", aliases: [] },
    { id: "conie", displayName: "Conie", aliases: [] },
    { id: "conra", displayName: "Conra", aliases: [] },
    { id: "david", displayName: "David", aliases: [] },
    { id: "diego", displayName: "Diego", aliases: [] },
    { id: "fede", displayName: "Fede", aliases: [] },
    { id: "franco", displayName: "Franco", aliases: [] },
    { id: "jp", displayName: "JP", aliases: [] },
    { id: "lara", displayName: "Lara", aliases: [] },
    { id: "lauta", displayName: "Lauta", aliases: [] },
    { id: "lea", displayName: "Lea", aliases: [] },
    { id: "marki", displayName: "Marki", aliases: [] },
    { id: "mateo", displayName: "Mateo", aliases: [] },
    { id: "mati", displayName: "Mati", aliases: [] },
    { id: "mazzi", displayName: "Mazzi", aliases: [] },
    { id: "mica", displayName: "Mica ❤", aliases: ["mica❤"] },
    { id: "ndm", displayName: "NDM", aliases: [] },
    { id: "negra", displayName: "Negra", aliases: [] },
    { id: "oso", displayName: "Oso", aliases: [] },
    { id: "row", displayName: "Row", aliases: [] },
    { id: "santi", displayName: "Santi", aliases: [] },
    { id: "signo", displayName: "Signo", aliases: [] },
    { id: "vali", displayName: "Vali", aliases: [] },
  ];

  for (const p of SEED_PLAYERS) {
    await sql.query(
      'INSERT INTO players (id, display_name, aliases) VALUES ($1, $2, $3)',
      [p.id, p.displayName, p.aliases]
    );
  }
  console.log(`Seeded ${SEED_PLAYERS.length} players into Neon.`);

  console.log("Seeding registered users into Neon...");
  const SEED_USERS = [
    {
      userId: "usr-signo",
      email: "signo@fulbo2026.club",
      handle: "@signo",
      displayName: "Signo",
      linkedPlayerId: "signo",
      dorsal: 10,
      position: "mediocampo",
      foot: "diestro",
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
    },
  ];

  for (const u of SEED_USERS) {
    await sql.query(
      `INSERT INTO users (id, email, handle, display_name, linked_player_id, dorsal, position, foot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [u.userId, u.email, u.handle, u.displayName, u.linkedPlayerId, u.dorsal, u.position, u.foot]
    );
  }
  console.log(`Seeded ${SEED_USERS.length} users into Neon.`);

  console.log("Seeding matches into Neon...");
  const SEED_MATCHES = [
    { id: "mun-001", tournamentType: "mundialito", category: "torneo", matchNumber: 1, date: "2026-01-18T20:00:00Z", cost: 5000, result: "win", personalGoals: 4, teamPlayers: ["agustin", "lea", "conra", "david"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 4, s2: 2 },
    { id: "mun-002", tournamentType: "mundialito", category: "torneo", matchNumber: 2, date: "2026-01-25T20:00:00Z", cost: 4000, result: "win", personalGoals: 4, teamPlayers: ["conra", "mati", "row", "lauta"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 5, s2: 3 },
    { id: "mun-003", tournamentType: "mundialito", category: "torneo", matchNumber: 3, date: "2026-01-31T20:00:00Z", cost: 4000, result: "win", personalGoals: 2, teamPlayers: ["ciorci", "jp", "conra", "signo"], phase: "r16", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 3, s2: 1 },
    { id: "mun-004", tournamentType: "mundialito", category: "torneo", matchNumber: 4, date: "2026-02-07T20:00:00Z", cost: 5000, result: "win", personalGoals: 6, teamPlayers: ["franco", "fede", "marki", "diego"], phase: "qf", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 7, s2: 2 },
    { id: "mun-005", tournamentType: "mundialito", category: "torneo", matchNumber: 5, date: "2026-02-19T20:00:00Z", cost: 4200, result: "win", personalGoals: 2, teamPlayers: ["agustin", "aiden", "conra", "ciorci"], phase: "sf", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 3, s2: 2 },
    { id: "mun-006", tournamentType: "mundialito", category: "torneo", matchNumber: 6, date: "2026-02-26T20:00:00Z", cost: 5500, result: "loss", personalGoals: 2, teamPlayers: ["aguado", "jp", "row", "ciorci"], phase: "final", notes: "Ajustada final", team1: "NAVIKX", team2: "CHALLENGER", s1: 2, s2: 3 },
    { id: "mun-007", tournamentType: "mundialito", category: "torneo", matchNumber: 7, date: "2026-03-24T20:00:00Z", cost: 5000, result: "win", personalGoals: 1, teamPlayers: ["conra", "oso", "signo", "ciorci"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 4, s2: 1 },
    { id: "mun-008", tournamentType: "mundialito", category: "torneo", matchNumber: 8, date: "2026-04-10T20:00:00Z", cost: 6700, result: "loss", personalGoals: 0, teamPlayers: ["agustin", "mati", "santi", "lauta"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 1, s2: 4 },
    { id: "mun-009", tournamentType: "mundialito", category: "torneo", matchNumber: 9, date: "2026-04-18T20:00:00Z", cost: 5500, result: "win", personalGoals: 1, teamPlayers: ["lauta", "signo", "row", "ciorci"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 5, s2: 2 },
    { id: "mun-010", tournamentType: "mundialito", category: "torneo", matchNumber: 10, date: "2026-05-01T20:00:00Z", cost: 5000, result: "loss", personalGoals: 2, teamPlayers: ["franco", "alesio", "mazzi", "marki", "agustin"], phase: "r16", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 2, s2: 5 },
    { id: "mun-011", tournamentType: "mundialito", category: "torneo", matchNumber: 11, date: "2026-05-02T20:00:00Z", cost: 9000, result: "win", personalGoals: 4, teamPlayers: ["signo", "agustin", "aiden", "oso"], phase: "group", notes: "x2 por aiden el precio", team1: "NAVIKX", team2: "CHALLENGER", s1: 6, s2: 3 },
    { id: "mun-012", tournamentType: "mundialito", category: "torneo", matchNumber: 12, date: "2026-06-12T20:00:00Z", cost: 5800, result: "win", personalGoals: 0, teamPlayers: ["row", "jp", "aiden", "agustin"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 3, s2: 0 },
    { id: "mun-013", tournamentType: "mundialito", category: "torneo", matchNumber: 13, date: "2026-08-02T20:00:00Z", cost: 4500, result: "win", personalGoals: 4, teamPlayers: ["signo", "mati", "agustin"], phase: "r16", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 5, s2: 1 },
    { id: "mun-014", tournamentType: "mundialito", category: "torneo", matchNumber: 14, date: "2026-08-15T20:00:00Z", cost: 4500, result: "win", personalGoals: 2, teamPlayers: ["signo", "conra", "andre", "lauta"], phase: "qf", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 4, s2: 2 },
    { id: "mun-015", tournamentType: "mundialito", category: "torneo", matchNumber: 15, date: "2026-08-17T20:00:00Z", cost: 5000, result: "loss", personalGoals: 4, teamPlayers: ["agustin", "mazzi", "fede", "mateo"], phase: "sf", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 4, s2: 5 },
    { id: "mun-016", tournamentType: "mundialito", category: "torneo", matchNumber: 16, date: "2026-08-22T20:00:00Z", cost: 6850, result: "win", personalGoals: 3, teamPlayers: ["signo", "andre", "aguado", "mati"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 5, s2: 3 },
    { id: "mun-017", tournamentType: "mundialito", category: "torneo", matchNumber: 17, date: "2026-09-24T20:00:00Z", cost: 6000, result: "loss", personalGoals: 0, teamPlayers: ["row", "fede", "jp", "conra"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 1, s2: 3 },
    { id: "mun-018", tournamentType: "mundialito", category: "torneo", matchNumber: 18, date: "2026-10-02T20:00:00Z", cost: 7500, result: "win", personalGoals: 4, teamPlayers: ["lauta", "andre", "signo", "agustin"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 6, s2: 2 },
    { id: "mun-019", tournamentType: "mundialito", category: "torneo", matchNumber: 19, date: "2026-10-16T20:00:00Z", cost: 6800, result: "loss", personalGoals: 3, teamPlayers: ["agustin", "signo", "ndm", "andre"], phase: "r16", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 3, s2: 4 },
    { id: "mun-020", tournamentType: "mundialito", category: "torneo", matchNumber: 20, date: "2026-10-24T20:00:00Z", cost: 5000, result: "loss", personalGoals: 6, teamPlayers: ["agustin", "andre", "fede", "conra"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 6, s2: 7 },
    { id: "mun-021", tournamentType: "mundialito", category: "torneo", matchNumber: 21, date: "2026-10-25T20:00:00Z", cost: 6500, result: "win", personalGoals: 1, teamPlayers: ["alesio", "franco", "vali", "mazzi"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 3, s2: 2 },
    { id: "mun-022", tournamentType: "mundialito", category: "torneo", matchNumber: 22, date: "2026-10-31T20:00:00Z", cost: 5500, result: "win", personalGoals: 1, teamPlayers: ["lauta", "agustin", "signo", "conra"], phase: "group", notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 4, s2: 2 },
    { id: "mix-001", tournamentType: "mixto", category: "mixto", matchNumber: 1, date: "2026-01-28T20:00:00Z", cost: 5200, result: "draw", personalGoals: 3, teamPlayers: ["lauta", "agustin", "negra", "mica"], phase: null, notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 11, s2: 11 },
    { id: "mix-002", tournamentType: "mixto", category: "mixto", matchNumber: 2, date: "2026-02-03T20:00:00Z", cost: 6000, result: "loss", personalGoals: 0, teamPlayers: ["row", "andre", "lara", "cande"], phase: null, notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 9, s2: 12 },
    { id: "mix-003", tournamentType: "mixto", category: "mixto", matchNumber: 3, date: "2026-02-10T20:00:00Z", cost: 6200, result: "win", personalGoals: 1, teamPlayers: ["mati", "fede", "clara", "conie"], phase: null, notes: null, team1: "NAVIKX", team2: "CHALLENGER", s1: 8, s2: 6 },
  ];

  for (const m of SEED_MATCHES) {
    await sql.query(
      `INSERT INTO matches (id, tournament_type, category, match_number, match_date, cost, court_total_cost, result, personal_goals, team_players, phase, notes, team1_name, team2_name, score_team1, score_team2, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        m.id,
        m.tournamentType,
        m.category,
        m.matchNumber,
        m.date,
        m.cost,
        m.cost * 5,
        m.result,
        m.personalGoals,
        m.teamPlayers,
        m.phase,
        m.notes,
        m.team1,
        m.team2,
        m.s1,
        m.s2,
        "usr-signo"
      ]
    );

    await sql.query(
      `INSERT INTO player_match_stats (user_id, match_id, goals_scored, court_cost_share, feeling)
       VALUES ($1, $2, $3, $4, $5)`,
      ["usr-signo", m.id, m.personalGoals || 0, m.cost, "en_racha"]
    );
  }

  console.log(`Seeded ${SEED_MATCHES.length} matches and user stats into Neon!`);

  const latest = await sql`
    SELECT id, team1_name, team2_name, score_team1, score_team2, match_date, category
    FROM matches
    ORDER BY match_date DESC, created_at DESC
    LIMIT 1;
  `;
  console.log("Latest match in Neon:", latest[0]);
}

migrateAndSeed().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});

