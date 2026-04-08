-- Migración: tabla de comunicados/avisos oficiales
-- Ejecutar manualmente en el dashboard de Supabase SQL Editor

CREATE TABLE IF NOT EXISTS comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'aviso', 'urgente')),
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Habilitar Row Level Security
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;

-- Lectura pública de comunicados visibles (sin autenticación)
CREATE POLICY "Public read visible comunicados"
  ON comunicados
  FOR SELECT
  USING (visible = true);

-- Solo admins pueden insertar, editar y eliminar
CREATE POLICY "Admin full access comunicados"
  ON comunicados
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Índice para ordenar por fecha descendente eficientemente
CREATE INDEX IF NOT EXISTS comunicados_created_at_idx ON comunicados (created_at DESC);
