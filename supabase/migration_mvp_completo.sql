-- =============================================
-- FutsalVall - Migración MVP Completo
-- Ejecutar en el Editor SQL de Supabase
-- =============================================

-- =============================================
-- 1. TABLA: ingresos
-- Transparencia económica - Ingresos
-- =============================================
CREATE TABLE IF NOT EXISTS ingresos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concepto TEXT NOT NULL,
  importe DECIMAL(10, 2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('inscripcion_equipo', 'donacion', 'sponsor', 'otro')),
  equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ingresos_fecha_idx ON ingresos(fecha);

ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ingresos
CREATE POLICY "Ingresos visibles para todos"
  ON ingresos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar ingresos"
  ON ingresos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- 2. TABLA: temporadas
-- Para palmares histórico
-- =============================================
CREATE TABLE IF NOT EXISTS temporadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  año_inicio INTEGER NOT NULL,
  año_fin INTEGER NOT NULL,
  activa BOOLEAN DEFAULT false,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(año_inicio, año_fin)
);

CREATE INDEX IF NOT EXISTS temporadas_activa_idx ON temporadas(activa);

ALTER TABLE temporadas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para temporadas
CREATE POLICY "Temporadas visibles para todos"
  ON temporadas FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar temporadas"
  ON temporadas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- 3. TABLA: jornadas
-- Agrupar partidos por jornadas
-- =============================================
CREATE TABLE IF NOT EXISTS jornadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temporada_id UUID REFERENCES temporadas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nombre TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temporada_id, numero)
);

ALTER TABLE jornadas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para jornadas
CREATE POLICY "Jornadas visibles para todos"
  ON jornadas FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar jornadas"
  ON jornadas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- 4. MEJORAS: Tabla partidos
-- Añadir ubicación y enlaces
-- =============================================
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS ubicacion TEXT;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS enlace_maps TEXT;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS campo_nombre TEXT;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS jornada_id UUID REFERENCES jornadas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS partidos_jornada_idx ON partidos(jornada_id);

-- =============================================
-- 5. MEJORAS: Tabla profiles
-- Añadir campos para jugadores libres
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS edad INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nivel INTEGER CHECK (nivel >= 1 AND nivel <= 5);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disponibilidad TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- =============================================
-- 6. TABLA: temporadas_campeones
-- Registrar campeones por temporada
-- =============================================
CREATE TABLE IF NOT EXISTS temporadas_campeones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temporada_id UUID NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temporada_id)
);

ALTER TABLE temporadas_campeones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campeones visibles para todos"
  ON temporadas_campeones FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar campeones"
  ON temporadas_campeones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- 7. TABLA: temporadas_goleadores
-- Máximo goleador por temporada
-- =============================================
CREATE TABLE IF NOT EXISTS temporadas_goleadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temporada_id UUID NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goles INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temporada_id)
);

ALTER TABLE temporadas_goleadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Goleadores visibles para todos"
  ON temporadas_goleadores FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar goleadores"
  ON temporadas_goleadores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- 8. TABLA: comprobantes_gastos
-- Justificantes de gastos
-- =============================================
CREATE TABLE IF NOT EXISTS comprobantes_gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gasto_id UUID NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  tipo_archivo TEXT NOT NULL,
  url_storage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE comprobantes_gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comprobantes visibles para todos"
  ON comprobantes_gastos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar comprobantes"
  ON comprobantes_gastos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- 9. TABLA: sugerencias
-- Feedback de usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS sugerencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('mejora', 'bug', 'sugerencia', 'otro')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'implementado', 'rechazado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sugerencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sugerencias visibles para todos"
  ON sugerencias FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear sugerencias"
  ON sugerencias FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admins pueden gestionar sugerencias"
  ON sugerencias FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- 10. TABLA: comentarios_partido
-- Comentarios en partidos
-- =============================================
CREATE TABLE IF NOT EXISTS comentarios_partido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comentarios_partido_idx ON comentarios_partido(partido_id);

ALTER TABLE comentarios_partido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentarios visibles para todos"
  ON comentarios_partido FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden comentar partidos"
  ON comentarios_partido FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admins pueden gestionar comentarios"
  ON comentarios_partido FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- 11. TABLA: invitaciones
-- Sistema de invitaciones
-- =============================================
CREATE TABLE IF NOT EXISTS invitaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('jugador', 'equipo')),
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
  creador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  usos_maximos INTEGER DEFAULT 1,
  usos_actuales INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitaciones_codigo_idx ON invitaciones(codigo);

ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitaciones visibles para todos"
  ON invitaciones FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear invitaciones"
  ON invitaciones FOR INSERT
  TO authenticated
  WITH CHECK (creador_id = auth.uid());

-- =============================================
-- 12. TABLA: traspasos
-- Ventana de fichajes
-- =============================================
CREATE TABLE IF NOT EXISTS traspasos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jugador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  equipo_origen_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  equipo_destino_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  temporada_id UUID REFERENCES temporadas(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'cancelado')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE traspasos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Traspasos visibles para todos"
  ON traspasos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar traspasos"
  ON traspasos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- VISTAS ACTUALIZADAS
-- =============================================

-- Vista de clasificación completa
DROP VIEW IF EXISTS clasificacion;
CREATE OR REPLACE VIEW clasificacion AS
WITH resumen AS (
  SELECT
    e.id,
    e.nombre,
    e.escudo_url,
    e.color_principal,
    COUNT(p.id) AS partidos_jugados,
    COALESCE(SUM(CASE
      WHEN (p.equipo_local_id = e.id AND p.goles_local > p.goles_visitante)
        OR (p.equipo_visitante_id = e.id AND p.goles_visitante > p.goles_local)
      THEN 1
      ELSE 0
    END), 0) AS ganados,
    COALESCE(SUM(CASE
      WHEN p.goles_local = p.goles_visitante THEN 1
      ELSE 0
    END), 0) AS empatados,
    COALESCE(SUM(CASE
      WHEN (p.equipo_local_id = e.id AND p.goles_local < p.goles_visitante)
        OR (p.equipo_visitante_id = e.id AND p.goles_visitante < p.goles_local)
      THEN 1
      ELSE 0
    END), 0) AS perdidos,
    COALESCE(SUM(CASE
      WHEN p.equipo_local_id = e.id THEN p.goles_local
      WHEN p.equipo_visitante_id = e.id THEN p.goles_visitante
      ELSE 0
    END), 0) AS gf,
    COALESCE(SUM(CASE
      WHEN p.equipo_local_id = e.id THEN p.goles_visitante
      WHEN p.equipo_visitante_id = e.id THEN p.goles_local
      ELSE 0
    END), 0) AS gc,
    COALESCE(SUM(CASE
      WHEN (p.equipo_local_id = e.id AND p.goles_local > p.goles_visitante)
        OR (p.equipo_visitante_id = e.id AND p.goles_visitante > p.goles_local)
      THEN 3
      WHEN p.goles_local = p.goles_visitante THEN 1
      ELSE 0
    END), 0) AS pts
  FROM equipos e
  LEFT JOIN partidos p
    ON (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
    AND p.estado = 'jugado'
    AND p.goles_local IS NOT NULL
    AND p.goles_visitante IS NOT NULL
  GROUP BY e.id, e.nombre, e.escudo_url, e.color_principal
)
SELECT
  ROW_NUMBER() OVER (
    ORDER BY pts DESC, (gf - gc) DESC, gf DESC, nombre ASC
  ) AS posicion,
  id,
  nombre,
  escudo_url,
  color_principal,
  partidos_jugados,
  ganados,
  empatados,
  perdidos,
  gf,
  gc,
  (gf - gc) AS dg,
  pts
FROM resumen
ORDER BY pts DESC, dg DESC, gf DESC, nombre ASC;

-- Vista de jugadores libres actualizada
DROP VIEW IF EXISTS jugadores_libres;
CREATE OR REPLACE VIEW jugadores_libres AS
SELECT 
  p.id,
  p.nombre,
  p.posicion,
  p.numero_camiseta,
  p.foto_url,
  p.edad,
  p.nivel,
  p.disponibilidad,
  p.descripcion
FROM profiles p
WHERE p.libre = true AND p.rol IN ('jugador', 'capitan');

-- Vista de resumen financiero
DROP VIEW IF EXISTS resumen_financiero;
CREATE OR REPLACE VIEW resumen_financiero AS
SELECT 
  'Ingresos' AS tipo,
  SUM(importe) AS total
FROM ingresos
UNION ALL
SELECT 
  'Gastos' AS tipo,
  SUM(importe) AS total
FROM gastos
UNION ALL
SELECT 
  'Saldo' AS tipo,
  (SELECT COALESCE(SUM(importe), 0) FROM ingresos) - 
  (SELECT COALESCE(SUM(importe), 0) FROM gastos) AS total;

-- =============================================
-- INSERTAR DATOS DE EJEMPLO
-- =============================================

-- Insertar una temporada de ejemplo
INSERT INTO temporadas (nombre, año_inicio, año_fin, activa, fecha_inicio, fecha_fin)
VALUES ('Temporada 2025-2026', 2025, 2026, true, '2025-09-01', '2026-06-30')
ON CONFLICT (año_inicio, año_fin) DO NOTHING;

-- Obtener la temporada activa
DO $$
DECLARE
  temp_id UUID;
BEGIN
  SELECT id INTO temp_id FROM temporadas WHERE activa = true LIMIT 1;
  
  -- Crear jornadas de ejemplo (primera vuelta - 15 jornadas)
  FOR i IN 1..15 LOOP
    INSERT INTO jornadas (temporada_id, numero, nombre, fecha_inicio, fecha_fin)
    VALUES (temp_id, i, CONCAT('Jornada ', i), NULL, NULL)
    ON CONFLICT (temporada_id, numero) DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- MENSAJE DE ÉXITO
-- =============================================
DO $$
BEGIN
  RAISE NOTICE 'Migración MVP completada exitosamente!';
END $$;
