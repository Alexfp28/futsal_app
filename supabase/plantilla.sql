-- =============================================
-- FutSal La Vall - Tabla Plantilla
-- Gestión de jugadores titulares y suplentes
-- =============================================
-- Tabla para gestionar la plantilla (titulares/suplentes)
CREATE TABLE
    IF NOT EXISTS plantilla (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        equipo_id UUID NOT NULL REFERENCES equipos (id) ON DELETE CASCADE,
        jugador_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
        es_titular BOOLEAN DEFAULT true,
        posicion_plantilla INTEGER, -- Orden en la lista (1-14)
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            UNIQUE (equipo_id, jugador_id)
    );

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS plantilla_equipo_idx ON plantilla (equipo_id);

CREATE INDEX IF NOT EXISTS plantilla_jugador_idx ON plantilla (jugador_id);

CREATE INDEX IF NOT EXISTS plantilla_titular_idx ON plantilla (es_titular);

-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================
ALTER TABLE plantilla ENABLE ROW LEVEL SECURITY;

-- Política: Capitanes pueden ver y gestionar la plantilla de su equipo
CREATE POLICY "Capitanes pueden gestionar plantilla de su equipo" ON plantilla FOR ALL TO authenticated USING (
    EXISTS (
        SELECT
            1
        FROM
            equipos
        WHERE
            id = equipo_id
            AND capitan_id = auth.uid ()
    )
);

-- Política: Jugadores pueden ver su posición en la plantilla
CREATE POLICY "Jugadores pueden ver su plantilla" ON plantilla FOR
SELECT
    TO authenticated USING (jugador_id = auth.uid ());

-- =============================================
-- FUNCIÓN Y TRIGGER PARA updated_at
-- =============================================
CREATE TRIGGER update_plantilla_updated_at BEFORE
UPDATE ON plantilla FOR EACH ROW EXECUTE FUNCTION update_updated_at_column ();

-- =============================================
-- VISTAS ÚTILES
-- =============================================
-- Vista de plantilla completa con información del jugador
CREATE
OR REPLACE VIEW plantilla_detallada AS
SELECT
    pl.id,
    pl.equipo_id,
    pl.jugador_id,
    pl.es_titular,
    pl.posicion_plantilla,
    pl.created_at,
    pl.updated_at,
    p.nombre as nombre_jugador,
    p.posicion as posicion_jugador,
    p.numero_camiseta,
    p.foto_url,
    e.nombre as nombre_equipo
FROM
    plantilla pl
    JOIN profiles p ON pl.jugador_id = p.id
    JOIN equipos e ON pl.equipo_id = e.id
ORDER BY
    pl.es_titular DESC,
    pl.posicion_plantilla ASC;

-- Vista de solicitudes de fichaje pendientes para capitanes
CREATE
OR REPLACE VIEW solicitudes_pendientes AS
SELECT
    sf.id,
    sf.jugador_id,
    sf.equipo_id,
    sf.estado,
    sf.created_at,
    p.nombre as nombre_jugador,
    p.posicion as posicion_jugador,
    p.foto_url,
    e.nombre as nombre_equipo
FROM
    solicitudes_fichaje sf
    JOIN profiles p ON sf.jugador_id = p.id
    JOIN equipos e ON sf.equipo_id = e.id
WHERE
    sf.estado = 'pendiente';