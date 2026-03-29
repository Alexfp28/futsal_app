-- Permitir que los administradores eliminen perfiles de usuario
-- Ejecutar en Supabase SQL Editor

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins pueden eliminar perfiles'
  ) THEN
    CREATE POLICY "Admins pueden eliminar perfiles"
      ON profiles FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE id = auth.uid() AND rol = 'admin'
        )
      );
  END IF;
END $$;
