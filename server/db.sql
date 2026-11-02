-- ========================================================
-- FULBO TRACKER 2026 - MODELO DE DATOS POSTGRESQL OFICIAL
-- ========================================================

-- Enums
CREATE TYPE competition_type AS ENUM ('torneo', 'mixto', 'regular');
CREATE TYPE feeling_state AS ENUM ('recuperacion', 'cansado', 'regular', 'en_forma', 'en_racha');

-- 1. Tabla de Usuarios / Jugadores Registrados
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    handle VARCHAR(50) UNIQUE NOT NULL,
    dorsal SMALLINT CHECK (dorsal >= 0 AND dorsal <= 99),
    position VARCHAR(50) DEFAULT 'todoterreno',
    foot VARCHAR(20) DEFAULT 'diestro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Partidos
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team1_name VARCHAR(100) NOT NULL,
    team2_name VARCHAR(100) NOT NULL,
    score_team1 SMALLINT NOT NULL CHECK (score_team1 >= 0),
    score_team2 SMALLINT NOT NULL CHECK (score_team2 >= 0),
    match_date TIMESTAMPTZ NOT NULL,
    category competition_type NOT NULL DEFAULT 'torneo',
    phase VARCHAR(50),
    court_total_cost NUMERIC(10, 2) DEFAULT 0.00 CHECK (court_total_cost >= 0),
    notes TEXT,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Participación y Estadísticas por Usuario (Relación M:N)
CREATE TABLE IF NOT EXISTS player_match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    goals_scored SMALLINT NOT NULL DEFAULT 0 CHECK (goals_scored >= 0),
    court_cost_share NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (court_cost_share >= 0),
    feeling feeling_state DEFAULT 'en_forma',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_match UNIQUE (user_id, match_id)
);

-- Índices de Alto Rendimiento
CREATE INDEX IF NOT EXISTS idx_matches_created_at_desc ON matches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_category ON matches (category);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_user ON player_match_stats (user_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON player_match_stats (match_id);

