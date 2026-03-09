-- =============================================
-- Script de migración: Permitir a capitanes gestionar perfiles de su equipo
-- =============================================

DROP POLICY IF EXISTS "Capitanes pueden gestionar perfiles de su equipo" ON profiles;

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
