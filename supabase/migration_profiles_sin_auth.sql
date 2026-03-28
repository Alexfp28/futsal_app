-- =============================================
-- Permitir crear perfiles manuales sin cuenta Auth
-- Ejecutar en el Editor SQL de Supabase
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT con.conname
  INTO fk_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'profiles'
    AND con.contype = 'f'
    AND pg_get_constraintdef(con.oid) ILIKE '%REFERENCES auth.users%';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

COMMENT ON COLUMN public.profiles.id IS
  'UUID del perfil. Puede venir de auth.users o generarse para perfiles creados manualmente por admin.';
