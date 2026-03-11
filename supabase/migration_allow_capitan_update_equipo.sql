-- =============================================
-- Script de migración: Permitir a capitanes actualizar datos de su equipo
-- =============================================

DROP POLICY IF EXISTS "Capitanes pueden actualizar su equipo" ON equipos;

CREATE POLICY "Capitanes pueden actualizar su equipo"
  ON equipos FOR UPDATE
  TO authenticated
  USING (
    capitan_id = auth.uid()
  );
