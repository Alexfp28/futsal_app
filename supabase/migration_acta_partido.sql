-- =============================================
-- Migration: Acta de Partido (Match Report)
-- =============================================
-- Adds columns to partidos table for detailed match reporting
-- and SELECT policy for estadisticas_partido_jugador

-- Add new columns to partidos table
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS hora_inicio TIME;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS hora_fin TIME;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS arbitro TEXT;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS redactado_por TEXT;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS confirmado BOOLEAN DEFAULT false;

-- Add SELECT policy for estadisticas_partido_jugador (allows non-admins to read)
CREATE POLICY "Estadisticas visibles para todos"
  ON estadisticas_partido_jugador FOR SELECT
  USING (true);

-- Note: observaciones column already exists in partidos (added in migration_mvp_completo.sql)
-- Note: estadisticas_partido_jugador table already exists with proper structure
