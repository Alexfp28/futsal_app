-- =============================================
-- Script de migración: Añadir campo 'origen' a solicitudes_fichaje
-- Este script debe ejecutarse en una base de datos existente
-- =============================================
-- 1. Añadir la columna 'origen' con valor por defecto 'jugador'
ALTER TABLE solicitudes_fichaje
ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'jugador';

-- 2. Añadir la restricción CHECK
ALTER TABLE solicitudes_fichaje
DROP CONSTRAINT IF EXISTS solicitudes_fichaje_origen_check;

ALTER TABLE solicitudes_fichaje ADD CONSTRAINT solicitudes_fichaje_origen_check CHECK (origen IN ('jugador', 'equipo'));

-- 3. Modificar la restricción UNIQUE para incluir origen
-- Primero eliminamos la restricción unique antigua si existe
ALTER TABLE solicitudes_fichaje
DROP CONSTRAINT IF EXISTS solicitudes_fichaje_jugador_id_equipo_id_key;

-- 4. Añadir la nueva restricción unique (permite solicitud del jugador Y del equipo)
ALTER TABLE solicitudes_fichaje ADD CONSTRAINT solicitudes_fichaje_unique_solicitudes UNIQUE (jugador_id, equipo_id, origen);

-- =============================================
-- Políticas RLS para solicitudes bidireccionales
-- =============================================
-- Eliminar políticas existentes de solicitudes_fichaje
DROP POLICY IF EXISTS "Jugadores pueden ver sus propias solicitudes" ON solicitudes_fichaje;

DROP POLICY IF EXISTS "Capitanes pueden ver solicitudes de su equipo" ON solicitudes_fichaje;

DROP POLICY IF EXISTS "Jugadores pueden crear solicitudes" ON solicitudes_fichaje;

DROP POLICY IF EXISTS "Capitanes pueden actualizar solicitudes de su equipo" ON solicitudes_fichaje;

-- Crear nuevas políticas
-- El jugador puede ver: solicitudes enviadas (origen = 'jugador') y recibidas (origen = 'equipo')
CREATE POLICY "Jugadores pueden ver sus propias solicitudes" ON solicitudes_fichaje FOR
SELECT
    TO authenticated USING (jugador_id = auth.uid ());

-- El capitán puede ver solicitudes hacia/desde su equipo
CREATE POLICY "Capitanes pueden ver solicitudes de su equipo" ON solicitudes_fichaje FOR
SELECT
    TO authenticated USING (
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

-- Jugadores pueden crear solicitudes enviadas por ellos (origen = 'jugador')
CREATE POLICY "Jugadores pueden crear solicitudes" ON solicitudes_fichaje FOR INSERT TO authenticated
WITH
    CHECK (
        jugador_id = auth.uid ()
        AND origen = 'jugador'
    );

-- Capitanes pueden crear solicitudes enviadas por su equipo (origen = 'equipo')
CREATE POLICY "Capitanes pueden crear solicitudes desde equipo" ON solicitudes_fichaje FOR INSERT TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT
                1
            FROM
                equipos
            WHERE
                id = equipo_id
                AND capitan_id = auth.uid ()
        )
        AND origen = 'equipo'
    );

-- Capitanes pueden actualizar solicitudes de su equipo
CREATE POLICY "Capitanes pueden actualizar solicitudes de su equipo" ON solicitudes_fichaje FOR
UPDATE TO authenticated USING (
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

-- =============================================
-- Nota: Las políticas de SELECT ya permiten tanto al jugador como al capitán
-- ver las solicitudes porque cada uno tiene acceso a través de su id
-- =============================================