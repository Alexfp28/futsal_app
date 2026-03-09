-- =============================================
-- Estadísticas por partido y jugador
-- =============================================

CREATE TABLE IF NOT EXISTS estadisticas_partido_jugador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goles INTEGER DEFAULT 0,
  asistencias INTEGER DEFAULT 0,
  tarjetas_amarillas INTEGER DEFAULT 0,
  tarjetas_rojas INTEGER DEFAULT 0,
  paradas_portero INTEGER DEFAULT 0,
  valoracion_mvp INTEGER, -- 1-10, opcional
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (partido_id, jugador_id)
);

ALTER TABLE estadisticas_partido_jugador ENABLE ROW LEVEL SECURITY;

-- Solo administradores pueden gestionar estadísticas
CREATE POLICY "Admins pueden gestionar estadisticas"
  ON estadisticas_partido_jugador FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- Vistas de ranking agregadas
-- =============================================

CREATE OR REPLACE VIEW ranking_goles AS
SELECT 
  p.id AS jugador_id,
  p.nombre,
  p.equipo_id,
  e.nombre AS equipo_nombre,
  COALESCE(SUM(epj.goles), 0) AS goles
FROM profiles p
LEFT JOIN estadisticas_partido_jugador epj ON epj.jugador_id = p.id
LEFT JOIN equipos e ON p.equipo_id = e.id
GROUP BY p.id, p.nombre, p.equipo_id, e.nombre
HAVING COALESCE(SUM(epj.goles), 0) > 0
ORDER BY goles DESC, nombre ASC;

CREATE OR REPLACE VIEW ranking_asistencias AS
SELECT 
  p.id AS jugador_id,
  p.nombre,
  p.equipo_id,
  e.nombre AS equipo_nombre,
  COALESCE(SUM(epj.asistencias), 0) AS asistencias
FROM profiles p
LEFT JOIN estadisticas_partido_jugador epj ON epj.jugador_id = p.id
LEFT JOIN equipos e ON p.equipo_id = e.id
GROUP BY p.id, p.nombre, p.equipo_id, e.nombre
HAVING COALESCE(SUM(epj.asistencias), 0) > 0
ORDER BY asistencias DESC, nombre ASC;

CREATE OR REPLACE VIEW ranking_sanciones AS
SELECT 
  p.id AS jugador_id,
  p.nombre,
  p.equipo_id,
  e.nombre AS equipo_nombre,
  COALESCE(SUM(epj.tarjetas_amarillas), 0) AS amarillas,
  COALESCE(SUM(epj.tarjetas_rojas), 0) AS rojas,
  COALESCE(SUM(epj.tarjetas_amarillas), 0) + COALESCE(SUM(epj.tarjetas_rojas), 0) AS total_sanciones
FROM profiles p
LEFT JOIN estadisticas_partido_jugador epj ON epj.jugador_id = p.id
LEFT JOIN equipos e ON p.equipo_id = e.id
GROUP BY p.id, p.nombre, p.equipo_id, e.nombre
HAVING (COALESCE(SUM(epj.tarjetas_amarillas), 0) + COALESCE(SUM(epj.tarjetas_rojas), 0)) > 0
ORDER BY total_sanciones DESC, nombre ASC;

CREATE OR REPLACE VIEW ranking_porteros AS
SELECT 
  p.id AS jugador_id,
  p.nombre,
  p.equipo_id,
  e.nombre AS equipo_nombre,
  COALESCE(SUM(epj.paradas_portero), 0) AS paradas
FROM profiles p
LEFT JOIN estadisticas_partido_jugador epj ON epj.jugador_id = p.id
LEFT JOIN equipos e ON p.equipo_id = e.id
WHERE p.posicion = 'Portero'
GROUP BY p.id, p.nombre, p.equipo_id, e.nombre
HAVING COALESCE(SUM(epj.paradas_portero), 0) > 0
ORDER BY paradas DESC, nombre ASC;

CREATE OR REPLACE VIEW ranking_mvp AS
SELECT 
  p.id AS jugador_id,
  p.nombre,
  p.equipo_id,
  e.nombre AS equipo_nombre,
  COUNT(epj.valoracion_mvp) AS partidos_valorados,
  AVG(epj.valoracion_mvp)::numeric(10,2) AS media_valoracion
FROM profiles p
LEFT JOIN estadisticas_partido_jugador epj ON epj.jugador_id = p.id AND epj.valoracion_mvp IS NOT NULL
LEFT JOIN equipos e ON p.equipo_id = e.id
GROUP BY p.id, p.nombre, p.equipo_id, e.nombre
HAVING COUNT(epj.valoracion_mvp) > 0
ORDER BY media_valoracion DESC, partidos_valorados DESC, nombre ASC;

