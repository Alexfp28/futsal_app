-- =============================================
-- POLÍTICAS DE SEGURIDAD PARA STORAGE
-- Bucket: fotos-perfil
-- =============================================

-- 1. Permitir que usuarios autenticados puedan subir fotos
-- Solo pueden subir fotos cuyo nombre de archivo comience con su ID de usuario
CREATE POLICY "Allow authenticated users to upload" ON storage.objects FOR INSERT TO authenticated
WITH
    CHECK (
        bucket_id = 'fotos-perfil' 
        AND (name LIKE CONCAT(auth.uid()::text, '-%') OR name LIKE CONCAT(auth.uid()::text, '/%'))
    );

-- 2. Permitir que usuarios autenticados puedan actualizar SUS PROPIAS fotos
-- Verifica que el nombre del archivo contenga el ID del usuario autenticado
CREATE POLICY "Allow users to update own photos" ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'fotos-perfil' 
    AND (name LIKE CONCAT(auth.uid()::text, '-%') OR name LIKE CONCAT(auth.uid()::text, '/%'))
);

-- 3. Permitir que cualquier usuario pueda ver las fotos de perfil
-- Esta política permite lectura pública de fotos (necesario para mostrar perfiles)
CREATE POLICY "Allow public to view photos" ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'fotos-perfil');

-- 4. Permitir que usuarios autenticados puedan eliminar SUS PROPIAS fotos
-- Verifica que el nombre del archivo contenga el ID del usuario autenticado
CREATE POLICY "Allow users to delete own photos" ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'fotos-perfil' 
    AND (name LIKE CONCAT(auth.uid()::text, '-%') OR name LIKE CONCAT(auth.uid()::text, '/%'))
);

-- 5. Permisos para el rol anon (usuarios no autenticados)
-- Los usuarios anon pueden solo ver fotos públicas, no subir/editar/eliminar
-- Nota: La política SELECT anterior ya cubre esto con TO public
