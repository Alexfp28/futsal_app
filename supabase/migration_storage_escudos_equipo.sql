-- =============================================
-- Script de migración: Políticas de Storage para el bucket escudos-equipo
-- =============================================

-- Dar permisos para subir imágenes al bucket escudos-equipo
-- (Asumiendo que has creado el bucket escudos-equipo como "public")
CREATE POLICY "Permitir a capitanes subir escudos"
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'escudos-equipo' 
    AND EXISTS (
      SELECT 1 FROM equipos
      WHERE capitan_id = auth.uid()
    )
  );

CREATE POLICY "Permitir a capitanes actualizar escudos"
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (
    bucket_id = 'escudos-equipo'
    AND EXISTS (
      SELECT 1 FROM equipos
      WHERE capitan_id = auth.uid()
    )
  );

CREATE POLICY "Permitir a capitanes eliminar escudos"
  ON storage.objects FOR DELETE
  TO authenticated 
  USING (
    bucket_id = 'escudos-equipo'
    AND EXISTS (
      SELECT 1 FROM equipos
      WHERE capitan_id = auth.uid()
    )
  );

CREATE POLICY "Los escudos son públicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'escudos-equipo');
