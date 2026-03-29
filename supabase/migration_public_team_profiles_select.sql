-- Permite consultas publicas de perfiles para paginas abiertas como /equipos.
-- Evitamos subconsultas a equipos porque provocan recursion con las politicas
-- existentes que ya consultan profiles.

DROP POLICY IF EXISTS "Perfiles de equipos visibles para todos" ON profiles;

CREATE POLICY "Perfiles de equipos visibles para todos"
  ON profiles FOR SELECT
  TO public
  USING (true);
