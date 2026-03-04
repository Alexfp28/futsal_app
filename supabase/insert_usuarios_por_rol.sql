-- =============================================
-- CONSULTAS PARA INSERTAR USUARIOS POR ROL
-- Ejecutar en el Editor SQL de Supabase
-- =============================================

-- NOTA: Estas consultas usan UUIDs fijos para simplificar la ejecución.
-- En producción, los usuarios se crean desde el cliente de Supabase.
-- Los passwords son 'password123' para todos los usuarios.

-- =============================================
-- 1. INSERTAR USUARIO CON ROL 'ADMIN'
-- =============================================

-- Crear usuario admin en auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@futsal.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"nombre": "Administrador Principal", "rol": "admin"}'::jsonb,
  NOW(),
  NOW()
);

-- Insertar perfil del admin
INSERT INTO profiles (id, nombre, rol, libre, posicion, numero_camiseta)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Administrador Principal',
  'admin',
  true,
  'Universal',
  1
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. INSERTAR USUARIO CON ROL 'CAPITAN'
-- =============================================

-- Crear usuario capitán en auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'capitan@futsal.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"nombre": "Capitán Equipo", "rol": "capitan"}'::jsonb,
  NOW(),
  NOW()
);

-- Insertar perfil del capitán
INSERT INTO profiles (id, nombre, rol, libre, posicion, numero_camiseta)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Capitán Equipo',
  'capitan',
  false,
  'Ala',
  10
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. INSERTAR USUARIO CON ROL 'JUGADOR'
-- =============================================

-- Crear usuario jugador en auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'jugador@futsal.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"nombre": "Jugador normal", "rol": "jugador"}'::jsonb,
  NOW(),
  NOW()
);

-- Insertar perfil del jugador
INSERT INTO profiles (id, nombre, rol, libre, posicion, numero_camiseta)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Jugador normal',
  'jugador',
  true,
  'Cierre',
  7
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VERIFICAR QUE SE INSERTARON CORRECTAMENTE
-- =============================================
SELECT id, nombre, rol, libre, posicion, numero_camiseta FROM profiles;
