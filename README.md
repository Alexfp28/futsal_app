# FutSal La Vall

Aplicación web para la gestión de partidos de fútbol sala entre jugadores jóvenes.

## 🚀 Stack Tecnológico

- **Frontend**: Vue 3 + Vite
- **Estilos**: Tailwind CSS
- **Estado**: Pinia
- **Routing**: Vue Router 4
- **Backend**: Supabase (PostgreSQL + Auth)
- **Gráficos**: Chart.js + vue-chartjs

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta en [Supabase](https://supabase.com) (gratuita)

## 🛠️ Instalación

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ve a **Project Settings > API** y copia:
   - Project URL
   - anon public key
3. Copia `.env.example` a `.env` y completa los valores:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 3. Crear tablas en Supabase

1. Ve al **SQL Editor** en Supabase
2. Copia el contenido de `supabase/schema.sql`
3. Ejecuta el script

### 4. Configurar autenticación en Supabase

1. Ve a **Authentication > Providers**
2. Asegúrate de que **Email** está habilitado
3. Configura las URLs de redirección si es necesario

### 5. Crear usuario administrador

1. Regístrate en la aplicación
2. En Supabase, ve a **Table Editor > profiles**
3. Cambia el `rol` del usuario a `admin`

## 🏃 Ejecutar

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── assets/styles/       # Estilos globales (Tailwind)
├── components/
│   └── layout/          # Navbar, Footer, Sidebar
├── lib/
│   └── supabase.js      # Cliente Supabase
├── pages/
│   ├── public/          # Páginas públicas
│   ├── auth/            # Login, Registro
│   ├── admin/           # Panel administrador
│   ├── capitan/         # Panel capitán
│   └── jugador/         # Perfil jugador
├── router/              # Vue Router + guards
├── stores/              # Pinia stores
└── App.vue
```

## 🎨 Paleta de Colores

| Color      | Hex       | Uso                       |
| ---------- | --------- | ------------------------- |
| Primario   | `#164bf0` | Botones, enlaces, acentos |
| Secundario | `#f6ec15` | Badges, destacados        |
| Terciario  | `#708cc5` | Elementos secundarios     |
| Fondo      | `#f8f9fa` | Fondo de página           |
| Texto      | `#1a1a2e` | Texto principal           |

## 👥 Roles y Permisos

| Acción               | Admin | Capitán | Jugador |
| -------------------- | ----- | ------- | ------- |
| Ver páginas públicas | ✅    | ✅      | ✅      |
| Gestionar equipos    | ✅    | ❌      | ❌      |
| Gestionar su equipo  | ✅    | ✅      | ❌      |
| Fichar jugadores     | ✅    | ✅      | ❌      |
| Solicitar unirse     | ✅    | ❌      | ✅      |
| Registrar gastos     | ✅    | ❌      | ❌      |
| Crear partidos       | ✅    | ❌      | ❌      |

## 📱 Páginas

### Públicas

- **Identidad**: Descripción de la organización
- **Equipos**: Lista de equipos inscritos
- **Jugadores Libres**: Jugadores disponibles para fichar
- **Reglamento**: Normas de juego
- **Código de Conducta**: Normas de comportamiento
- **Economía**: Gráfico de gastos (transparencia)
- **Calendario**: Partidos programados

### Privadas

- **Login/Registro**: Autenticación
- **Panel Admin**: CRUD completo
- **Panel Capitán**: Gestión de equipo
- **Perfil Jugador**: Ver/editar perfil, solicitudes

## 📦 Despliegue

### Vercel (recomendado)

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm run build
# Subir carpeta dist/
```

### Variables de entorno en producción

No olvides configurar las variables de entorno en tu plataforma de despliegue:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📄 Licencia

Proyecto privado para FutSal La Vall.
