-- =============================================
-- FutSal La Vall - Esquema de Base de Datos
-- Ejecutar en el Editor SQL de Supabase
-- =============================================

-- Habilitar la extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: profiles
-- Perfiles de usuario con roles
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'jugador' CHECK (rol IN ('admin', 'capitan', 'jugador')),
  equipo_id UUID, -- Se agregará FK después de crear equipos
  posicion TEXT CHECK (posicion IN ('Portero', 'Defensa', 'Ala', 'Cierre', 'Universal')),
  numero_camiseta INTEGER,
  foto_url TEXT,
  libre BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por equipo
CREATE INDEX IF NOT EXISTS profiles_equipo_id_idx ON profiles(equipo_id);
CREATE INDEX IF NOT EXISTS profiles_libre_idx ON profiles(libre);

-- =============================================
-- TABLA: equipos
-- Equipos inscritos en la organización
-- =============================================
CREATE TABLE IF NOT EXISTS equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  escudo_url TEXT,
  capitan_id UUID, -- Se agregará FK después de crear profiles
  color_principal TEXT DEFAULT '#164bf0',
  color_secundario TEXT DEFAULT '#f6ec15',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir foreign keys después de crear ambas tablas
ALTER TABLE profiles 
ADD CONSTRAINT profiles_equipo_id_fkey 
FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL;

ALTER TABLE equipos
ADD CONSTRAINT equipos_capitan_id_fkey
FOREIGN KEY (capitan_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- =============================================
-- TABLA: partidos
-- Partidos programados
-- =============================================
CREATE TABLE IF NOT EXISTS partidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipo_local_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  equipo_visitante_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  lugar TEXT NOT NULL DEFAULT 'Polideportivo Municipal',
  goles_local INTEGER,
  goles_visitante INTEGER,
  estado TEXT NOT NULL DEFAULT 'programado' CHECK (estado IN ('programado', 'jugado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS partidos_fecha_idx ON partidos(fecha);
CREATE INDEX IF NOT EXISTS partidos_estado_idx ON partidos(estado);

-- =============================================
-- TABLA: gastos
-- Registro de gastos de la organización
-- =============================================
CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concepto TEXT NOT NULL,
  importe DECIMAL(10, 2) NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Instalaciones', 'Material', 'Seguros', 'Premios', 'Árbitros', 'Otros')),
  fecha DATE NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS gastos_fecha_idx ON gastos(fecha);

-- =============================================
-- TABLA: solicitudes_fichaje
-- Solicitudes de jugadores para unirse a equipos
-- O de equipos para invitar a jugadores (sistema bidireccional)
-- =============================================
CREATE TABLE IF NOT EXISTS solicitudes_fichaje (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jugador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  origen TEXT NOT NULL DEFAULT 'jugador' CHECK (origen IN ('jugador', 'equipo')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(jugador_id, equipo_id, origen)
);

-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_fichaje ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Perfiles son visibles para todos los usuarios autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins pueden actualizar cualquier perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Capitanes pueden gestionar perfiles de su equipo"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM equipos
      WHERE id = profiles.equipo_id
        AND capitan_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM solicitudes_fichaje sf
      JOIN equipos e ON e.id = sf.equipo_id
      WHERE sf.jugador_id = profiles.id
        AND sf.estado IN ('pendiente', 'aceptada')
        AND e.capitan_id = auth.uid()
    )
  )
  WITH CHECK (
    equipo_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM equipos
      WHERE id = profiles.equipo_id
        AND capitan_id = auth.uid()
    )
  );

CREATE POLICY "Admins pueden insertar perfiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas para equipos
CREATE POLICY "Equipos son visibles para todos"
  ON equipos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar equipos"
  ON equipos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas para partidos
CREATE POLICY "Partidos son visibles para todos"
  ON partidos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar partidos"
  ON partidos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas para gastos
CREATE POLICY "Gastos son visibles para todos"
  ON gastos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar gastos"
  ON gastos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas para solicitudes_fichaje
-- El jugador puede ver:
-- 1. Sus solicitudes enviadas (origen = 'jugador')
-- 2. Las solicitudes recibidas de equipos (origen = 'equipo')
CREATE POLICY "Jugadores pueden ver sus propias solicitudes"
  ON solicitudes_fichaje FOR SELECT
  TO authenticated
  USING (
    jugador_id = auth.uid()
  );

-- El capitán puede ver:
-- 1. Solicitudes de jugadores hacia su equipo (origen = 'jugador')
-- 2. Solicitudes enviadas por su equipo (origen = 'equipo')
CREATE POLICY "Capitanes pueden ver solicitudes de su equipo"
  ON solicitudes_fichaje FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM equipos 
      WHERE id = equipo_id AND capitan_id = auth.uid()
    )
  );

-- Jugadores pueden crear solicitudes enviadas por ellos
CREATE POLICY "Jugadores pueden crear solicitudes"
  ON solicitudes_fichaje FOR INSERT
  TO authenticated
  WITH CHECK (
    jugador_id = auth.uid() 
    AND origen = 'jugador'
  );

-- Capitanes pueden crear solicitudes enviadas por su equipo
CREATE POLICY "Capitanes pueden crear solicitudes desde equipo"
  ON solicitudes_fichaje FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM equipos 
      WHERE id = equipo_id AND capitan_id = auth.uid()
    )
    AND origen = 'equipo'
  );

-- Capitanes pueden actualizar solicitudes hacia su equipo (origen = 'jugador')
-- Y pueden actualizar las solicitudes enviadas por su equipo (origen = 'equipo')
CREATE POLICY "Capitanes pueden actualizar solicitudes de su equipo"
  ON solicitudes_fichaje FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM equipos 
      WHERE id = equipo_id AND capitan_id = auth.uid()
    )
  );

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipos_updated_at
  BEFORE UPDATE ON equipos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partidos_updated_at
  BEFORE UPDATE ON partidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitudes_updated_at
  BEFORE UPDATE ON solicitudes_fichaje
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
-- Se ejecuta cuando un usuario se registra
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol, libre)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'jugador'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrar usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- DATOS DE EJEMPLO (Opcional)
-- =============================================

-- Insertar equipos de ejemplo
INSERT INTO equipos (nombre, color_principal, color_secundario) VALUES
('Los Tigres', '#164bf0', '#f6ec15'),
('Águilas FC', '#dc2626', '#ffffff'),
('La Vall United', '#16a34a', '#000000'),
('Deportivo Juventud', '#7c3aed', '#fbbf24'),
('CF San José', '#0ea5e9', '#1e3a5f'),
('Atlético Vall', '#f97316', '#1f2937')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================
-- TABLA: convocatorias
-- Convocatorias de jugadores para cada partido
-- =============================================
CREATE TABLE IF NOT EXISTS convocatorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  es_suplente BOOLEAN DEFAULT false,
  confirmado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(partido_id, jugador_id)
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS convocatorias_partido_idx ON convocatorias(partido_id);
CREATE INDEX IF NOT EXISTS convocatorias_jugador_idx ON convocatorias(jugador_id);

-- Política RLS para convocatorias
ALTER TABLE convocatorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Convocatorias visibles para todos"
  ON convocatorias FOR SELECT
  USING (true);

CREATE POLICY "Capitanes pueden gestionar convocatorias de su equipo"
  ON convocatorias FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND rol IN ('admin', 'capitan')
    )
  );

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de jugadores libres
CREATE OR REPLACE VIEW jugadores_libres AS
SELECT 
  p.id,
  p.nombre,
  p.posicion,
  p.numero_camiseta,
  p.foto_url
FROM profiles p
WHERE p.libre = true AND p.rol = 'jugador';

-- Vista de clasificación (si se quiere implementar liga)
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

-- Vista de convocatorias con información de partido y jugador
CREATE OR REPLACE VIEW convocatorias_detalladas AS
SELECT 
  c.id,
  c.partido_id,
  c.jugador_id,
  c.es_suplente,
  c.confirmado,
  p.fecha,
  p.lugar,
  p.estado as estado_partido,
  el.nombre as equipo_local,
  ev.nombre as equipo_visitante,
  pr.nombre as nombre_jugador,
  pr.posicion,
  pr.numero_camiseta,
  pr.foto_url as foto_jugador,
  e.nombre as equipo_nombre
FROM convocatorias c
JOIN partidos p ON c.partido_id = p.id
JOIN equipos el ON p.equipo_local_id = el.id
JOIN equipos ev ON p.equipo_visitante_id = ev.id
JOIN profiles pr ON c.jugador_id = pr.id
LEFT JOIN equipos e ON pr.equipo_id = e.id;
