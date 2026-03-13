# Modelo de Base de Datos - FutsalVall (MVP)

## Resumen del Estado Actual

El proyecto ya cuenta con una estructura de base de datos parcialmente implementada que cubre varias funcionalidades del MVP:

| Tabla/Recurso                  | Estado      | Descripción                                  |
| ------------------------------ | ----------- | -------------------------------------------- |
| `profiles`                     | ✅ Completo | Usuarios con roles (admin, capitan, jugador) |
| `equipos`                      | ✅ Completo | Equipos con capitanes y colores              |
| `partidos`                     | ✅ Completo | Partidos con estados y resultados            |
| `gastos`                       | ✅ Completo | Registro de gastos por categoría             |
| `solicitudes_fichaje`          | ✅ Completo | Sistema de fichajes bidireccional            |
| `convocatorias`                | ✅ Completo | Convocatorias de jugadores                   |
| `estadisticas_partido_jugador` | ✅ Completo | Goles, asistencias, tarjetas, paradas, MVP   |
| `ranking_goles`                | ✅ Completo | Vista de goleadores                          |
| `ranking_asistencias`          | ✅ Completo | Vista de asistentes                          |
| `ranking_sanciones`            | ✅ Completo | Vista de tarjetas                            |
| `ranking_porteros`             | ✅ Completo | Vista de mejores porteros                    |
| `ranking_mvp`                  | ✅ Completo | Vista de MVP                                 |

---

## Tablas Nuevas Necesarias para MVP

### 1. temporadas (PARA PALMARÉS HISTÓRICO)

```sql
CREATE TABLE IF NOT EXISTS temporadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL, -- Ej: "Temporada 2025-2026"
  año_inicio INTEGER NOT NULL,
  año_fin INTEGER NOT NULL,
  activa BOOLEAN DEFAULT false,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS temporadas_activa_idx ON temporadas(activa);
```

### 2. ingresos (PARA TRANSPARENCIA ECONÓMICA)

```sql
CREATE TABLE IF NOT EXISTS ingresos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concepto TEXT NOT NULL,
  importe DECIMAL(10, 2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('inscripcion_equipo', 'donacion', 'sponsor', 'otro')),
  equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL, -- Para inscripciones
  fecha DATE NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ingresos_fecha_idx ON ingresos(fecha);
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingresos visibles para todos"
  ON ingresos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar ingresos"
  ON ingresos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

### 3. comprobantes_gastos (PARA TRANSPARENCIA ECONÓMICA)

```sql
CREATE TABLE IF NOT EXISTS comprobantes_gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gasto_id UUID NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  tipo_archivo TEXT NOT NULL, -- 'pdf', 'imagen'
  url_storage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE comprobantes_gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comprobantes visibles para todos"
  ON comprobantes_gastos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar comprobantes"
  ON comprobantes_gastos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

### 4. sugerencias (PARA FEEDBACK)

```sql
CREATE TABLE IF NOT EXISTS sugerencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('mejora', 'bug', 'sugerencia', 'otro')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'implementado', 'rechazado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sugerencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sugerencias visibles para todos"
  ON sugerencias FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear sugerencias"
  ON sugerencias FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admins pueden gestionar sugerencias"
  ON sugerencias FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

### 5. comentarios_partido (PARA FEEDBACK EN PARTIDOS)

```sql
CREATE TABLE IF NOT EXISTS comentarios_partido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comentarios_partido_idx ON comentarios_partido(partido_id);
ALTER TABLE comentarios_partido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentarios visibles para todos"
  ON comentarios_partido FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden comentar partidos"
  ON comentarios_partido FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admins pueden gestionar comentarios"
  ON comentarios_partido FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

### 6. invitaciones (PARA SISTEMA DE INVITACIONES)

```sql
CREATE TABLE IF NOT EXISTS invitaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('jugador', 'equipo')),
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE, -- Si es invitación para equipo
  creador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  usos_maximos INTEGER DEFAULT 1,
  usos_actuales INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitaciones_codigo_idx ON invitaciones(codigo);
```

### 7. temporadas_camapeon y temporadas_goleador (PARA PALMARÉS HISTÓRICO)

```sql
-- Tabla para registrar el campeón de cada temporada
CREATE TABLE IF NOT EXISTS temporadas_campeones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temporada_id UUID NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temporada_id)
);

-- Tabla para registrar el máximo goleador de cada temporada
CREATE TABLE IF NOT EXISTS temporadas_goleadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temporada_id UUID NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goles INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temporada_id)
);
```

### 8. jornadas (PARA MEJORAR CALENDARIO)

```sql
-- Agrupar partidos por jornadas
CREATE TABLE IF NOT EXISTS jornadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temporada_id UUID REFERENCES temporadas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nombre TEXT, -- Ej: "Jornada 1"
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(temporada_id, numero)
);

-- Añadir campo jornada_id a partidos
ALTER TABLE partidos ADD COLUMN jornada_id UUID REFERENCES jornadas(id) ON DELETE SET NULL;
```

---

## Mejoras a Tablas Existentes

### 1. Mejorar tabla `partidos`

```sql
-- Añadir campo de ubicación con coordenadas/enlace
ALTER TABLE partidos ADD COLUMN ubicacion TEXT; -- Dirección del campo
ALTER TABLE partidos ADD COLUMN enlace_maps TEXT; -- Enlace a Google Maps
ALTER TABLE partidos ADD COLUMN observaciones TEXT; -- Notas adicionales

-- Ya existe el campo lugar, pero podemos mejorarlo
ALTER TABLE partidos ADD COLUMN campo_nombre TEXT; -- Nombre del campo/pabellón
```

### 2. Mejorar tabla `profiles` para Jugadores Libres

```sql
-- Añadir campos para mejorar la sección de jugadores libres
ALTER TABLE profiles ADD COLUMN edad INTEGER;
ALTER TABLE profiles ADD COLUMN nivel INTEGER CHECK (nivel >= 1 AND nivel <= 5); -- 1 a 5 estrellas
ALTER TABLE profiles ADD COLUMN disponibilidad TEXT; -- Días/horas disponibles
ALTER TABLE profiles ADD COLUMN telefono TEXT;
ALTER TABLE profiles ADD COLUMN descripcion TEXT; -- Breve descripción del jugador
```

### 3. Añadir tabela `traspasos` (PARA VENTANA DE FICHATES)

```sql
CREATE TABLE IF NOT EXISTS traspasos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jugador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  equipo_origen_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  equipo_destino_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  temporada_id UUID REFERENCES temporadas(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'cancelado')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE traspasos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Traspasos visibles para todos"
  ON traspasos FOR SELECT
  USING (true);

CREATE POLICY "Admins pueden gestionar traspasos"
  ON traspasos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

---

## Vistas SQL Recomendadas (Mejoras)

### Vista de Clasificación Mejorada

```sql
CREATE OR REPLACE VIEW clasificacion_completa AS
SELECT
  ROW_NUMBER() OVER (ORDER BY
    COALESCE(SUM(CASE
      WHEN (p.goles_local > p.goles_visitante AND p.equipo_local_id = e.id)
        OR (p.goles_visitante > p.goles_local AND p.equipo_visitante_id = e.id)
      THEN 3
      WHEN p.goles_local = p.goles_visitante AND p.goles_local IS NOT NULL THEN 1
      ELSE 0
    END), 0) DESC,
    (COALESCE(SUM(CASE WHEN p.equipo_local_id = e.id THEN p.goles_local ELSE p.goles_visitante END), 0) +
     COALESCE(SUM(CASE WHEN p.equipo_visitante_id = e.id THEN p.goles_visitante ELSE p.goles_local END), 0)) -
    (COALESCE(SUM(CASE WHEN p.equipo_local_id = e.id THEN p.goles_visitante ELSE p.goles_local END), 0) +
     COALESCE(SUM(CASE WHEN p.equipo_visitante_id = e.id THEN p.goles_local ELSE p.goles_visitante END), 0)) DESC
  ) AS posicion,
  e.id,
  e.nombre,
  e.escudo_url,
  e.color_principal,
  COUNT(p.id) AS partidos_jugados,
  SUM(CASE
    WHEN (p.goles_local > p.goles_visitante AND p.equipo_local_id = e.id)
      OR (p.goles_visitante > p.goles_local AND p.equipo_visitante_id = e.id)
    THEN 1 ELSE 0
  END) AS ganados,
  SUM(CASE
    WHEN p.goles_local = p.goles_visitante AND p.goles_local IS NOT NULL THEN 1 ELSE 0
  END) AS empatados,
  SUM(CASE
    WHEN (p.goles_local < p.goles_visitante AND p.equipo_local_id = e.id)
      OR (p.goles_visitante < p.goles_local AND p.equipo_visitante_id = e.id)
    THEN 1 ELSE 0
  END) AS perdidos,
  COALESCE(SUM(CASE WHEN p.equipo_local_id = e.id THEN p.goles_local ELSE p.goles_visitante END), 0) +
  COALESCE(SUM(CASE WHEN p.equipo_visitante_id = e.id THEN p.goles_visitante ELSE p.goles_local END), 0) AS gf,
  COALESCE(SUM(CASE WHEN p.equipo_local_id = e.id THEN p.goles_visitante ELSE p.goles_local END), 0) +
  COALESCE(SUM(CASE WHEN p.equipo_visitante_id = e.id THEN p.goles_local ELSE p.goles_visitante END), 0) AS gc,
  (COALESCE(SUM(CASE WHEN p.equipo_local_id = e.id THEN p.goles_local ELSE p.goles_visitante END), 0) +
   COALESCE(SUM(CASE WHEN p.equipo_visitante_id = e.id THEN p.goles_visitante ELSE p.goles_local END), 0)) -
  (COALESCE(SUM(CASE WHEN p.equipo_local_id = e.id THEN p.goles_visitante ELSE p.goles_local END), 0) +
   COALESCE(SUM(CASE WHEN p.equipo_visitante_id = e.id THEN p.goles_local ELSE p.goles_visitante END), 0)) AS dg,
  COALESCE(SUM(CASE
    WHEN (p.goles_local > p.goles_visitante AND p.equipo_local_id = e.id)
      OR (p.goles_visitante > p.goles_local AND p.equipo_visitante_id = e.id)
    THEN 3
    WHEN p.goles_local = p.goles_visitante AND p.goles_local IS NOT NULL THEN 1
    ELSE 0
  END), 0) AS pts
FROM equipos e
LEFT JOIN partidos p ON (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
  AND p.estado = 'jugado'
GROUP BY e.id, e.nombre, e.escudo_url, e.color_principal
ORDER BY pts DESC, dg DESC, gf DESC;
```

### Vista de Resumen Financiero

```sql
CREATE OR REPLACE VIEW resumen_financiero AS
SELECT
  'Ingresos' AS tipo,
  SUM(importe) AS total
FROM ingresos
UNION ALL
SELECT
  'Gastos' AS tipo,
  SUM(importe) AS total
FROM gastos
UNION ALL
SELECT
  'Saldo' AS tipo,
  (SELECT COALESCE(SUM(importe), 0) FROM ingresos) -
  (SELECT COALESCE(SUM(importe), 0) FROM gastos) AS total;
```

---

## Resumen de Prioridades de Implementación

| Prioridad | Tabla/Vista                          | Descripción                        |
| --------- | ------------------------------------ | ---------------------------------- |
| 🔴 Alta   | `ingresos`                           | Transparencias económica           |
| 🔴 Alta   | `clasificacion_completa`             | Vista mejorada de clasificación    |
| 🔴 Alta   | `partidos.ubicacion` + `enlace_maps` | Ubicación de campos                |
| 🟡 Media  | `jugadores_libres` mejorada          | Añadir nivel, disponibilidad, edad |
| 🟡 Media  | `temporadas`                         | Para palmares histórico            |
| 🟡 Media  | `jornadas`                           | Agrupar partidos por jornadas      |
| 🟢 Baja   | `comprobantes_gastos`                | Justificantes de gastos            |
| 🟢 Baja   | `sugerencias`                        | Feedback de usuarios               |
| 🟢 Baja   | `comentarios_partido`                | Comentarios en partidos            |
| 🟢 Baja   | `invitaciones`                       | Sistema de invitaciones            |
| 🟢 Baja   | `traspasos`                          | Ventana de fichajes                |

---

## Sistema de Roles - Recomendaciones

El sistema de roles actual en `profiles.rol` con valores (`admin`, `capitan`, `jugador`) es correcto. Recomendaciones adicionales:

1. **Visitante (sin login)**: Se maneja mediante políticas RLS que permiten SELECT sin autenticación
2. **Jugador**: Puede ver todo, editar su perfil, crear solicitudes de fichaje
3. **Capitán**: Además de lo anterior, puede gestionar convocatorias y estadísticas de su equipo
4. **Admin**: Control total sobre todas las tablas

Las políticas RLS existentes son correctas y deberían mantenerse.
