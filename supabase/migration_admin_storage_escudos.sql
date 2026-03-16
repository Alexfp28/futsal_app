-- =============================================
-- Migración: Políticas de Storage para admins en bucket escudos-equipo
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =============================================
-- Los admins necesitan poder subir/actualizar/eliminar cualquier escudo,
-- no solo los de su equipo (como los capitanes).

-- Helper: verificar si el usuario es admin
-- (reutiliza la tabla profiles igual que las otras políticas)

CREATE POLICY "Permitir a admins subir escudos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'escudos-equipo'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND rol = 'admin'
    )
  );

CREATE POLICY "Permitir a admins actualizar escudos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'escudos-equipo'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND rol = 'admin'
    )
  );

CREATE POLICY "Permitir a admins eliminar escudos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'escudos-equipo'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND rol = 'admin'
    )
  );
