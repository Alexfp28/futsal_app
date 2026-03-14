# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Start Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

Development server runs at `http://localhost:5173` (Vite default). The app requires `.env` with Supabase credentials to function.

## 📁 Project Structure

This is a **Vue 3 + Supabase** web application for managing futsal (indoor soccer) tournaments between youth players.

### Directory Layout

- **`src/`** - Application source code
  - **`pages/`** - Vue components organized by section:
    - `public/` - Publicly accessible pages (Calendario, Equipos, Ranking, Palmares, etc.)
    - `auth/` - Login and registration pages
    - `admin/` - Admin dashboard and CRUD panels (Equipos, Jugadores, Partidos, Gastos)
    - `capitan/` - Team captain management panels
    - `jugador/` - Player profile pages
    - `intranet/` - Private authenticated home page
  - **`components/`** - Reusable Vue components
    - `layout/` - Navbar, Footer
    - `intranet/` - Intranet-specific components (calendar, tables)
  - **`router/`** - Vue Router configuration with auth guards and role-based access
  - **`stores/`** - Pinia state management (currently just `auth.js`)
  - **`lib/`** - Utility libraries (Supabase client initialization)
  - **`constants/`** - Constants like strings
  - **`assets/`** - Global styles, tailwind configuration
- **`supabase/`** - Database migrations and schema SQL files
- **`public/`** - Static assets
- **`vite.config.js`** - Vite bundler configuration
- **`vercel.json`** - Vercel deployment routes configuration

## 🏗️ Architecture & Key Patterns

### Authentication Flow

Auth state is managed in [src/stores/auth.js](src/stores/auth.js) using Pinia:

1. **Initialization**: The auth store calls `initialize()` on app startup (triggered by router guard)
2. **Hydration**: First checks localStorage for cached user/profile data (instant UI)
3. **Listener Setup**: Configures Supabase `onAuthStateChange` listener (one-time)
4. **Session Verification**: Queries Supabase for actual session, syncs profile from database
5. **Persistence**: After any auth change, user and profile data are saved to localStorage
6. **Offline Support**: If Supabase is unavailable but localStorage has data, the app continues with cached auth state

Key store methods: `initialize()`, `login()`, `register()`, `logout()`, `updateProfile()`, `verifySession()`, `refreshProfile()`

### Routing & Role-Based Access Control

[src/router/index.js](src/router/index.js) defines all routes with metadata for access control:

- Routes use `meta.requiresAuth: true` to require authentication
- Routes use `meta.roles: ['admin', 'capitan', 'jugador']` to specify allowed roles
- Routes use `meta.guest: true` for redirect authenticated users away (login/register pages)
- **Router guard** (`router.beforeEach`) enforces auth checks before route navigation
- Page titles are set dynamically via `meta.title`

**Role hierarchy**: admin > capitan > jugador. Admins can access all admin and capitan routes.

### State Management

Currently minimal—only authentication state in Pinia:
- **auth store** ([src/stores/auth.js](src/stores/auth.js)): `user`, `profile`, `loading`, `error`, `initialized`
- **Getters**: `isAuthenticated`, `isAdmin`, `isCapitan`, `isJugador`, `userRole`, `userName`

Other data (equipos, jugadores, partidos, etc.) is fetched directly from Supabase in components with `supabase.from().select()` calls.

### Database & Supabase

- **Client**: [src/lib/supabase.js](src/lib/supabase.js) — exports the Supabase client and helpers
- **Helpers**: `getUserProfile(userId)` - fetches profile + related team; `checkUserRole(userId)`
- **Migrations**: SQL files in `supabase/` directory:
  - `schema.sql` - Initial table definitions
  - `migration_mvp_completo.sql` - Latest comprehensive schema (profiles, equipos, jugadores, partidos, gastos, etc.)
  - `storage_policies.sql` - Supabase Storage access rules for team emblems
  - Others are archived/experimental migrations
- **Auth**: Supabase Auth handles sign-up/sign-in; profiles table is synced via database triggers on user creation
- **RLS (Row Level Security)**: Policies restrict data access by user role and ownership

### Styling

- **Framework**: Tailwind CSS (v3.4.1)
- **Config**: [tailwind.config.js](tailwind.config.js) — likely defines color palette, extends spacing, etc.
- **PostCSS**: [postcss.config.js](postcss.config.js) — processes Tailwind
- **Theme Colors** (from README):
  - Primary: `#164bf0` (blue)
  - Secondary: `#f6ec15` (yellow)
  - Tertiary: `#708cc5` (muted blue)
  - Background: `#f8f9fa` (light gray)
  - Text: `#1a1a2e` (dark)

### Deployment

Deployed on **Vercel**. Configuration in [vercel.json](vercel.json):
- SPA routing: `{ "handle": "filesystem" }` first serves static files, then `{ "src": "/(.*)", "dest": "/index.html" }` catches all routes and serves index.html (Vue Router takes over)
- Environment variables needed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## 👥 User Roles & Permissions

| Role | Can Access | Can Modify |
|------|-----------|-----------|
| **Admin** | All sections | Everything (teams, players, matches, expenses) |
| **Capitán** | Admin routes + own team | Own team data, player roster |
| **Jugador** | Public + profile + join requests | Own profile, team requests |
| **Guest** | Public pages + auth pages | Nothing (read-only) |

See [src/router/index.js](src/router/index.js) lines 150-245 for route role definitions.

## 🗄️ Database Schema (High-Level)

Key tables (see `supabase/schema.sql` and `supabase/migration_mvp_completo.sql`):

- **profiles** - User profiles, linked to auth.users; includes rol (admin/capitan/jugador), equipo_id, nombre
- **equipos** - Teams; created_by admin, linked to profiles (capitan_id)
- **jugadores** - Player roster per team; many-to-one with equipos
- **partidos** - Matches; tracks teams, date, location, result
- **gastos** - Expenses for transparency
- **palmares** - Tournament history/winners
- **traspasos** - Transfer market (player movement requests)
- **invitaciones** - Team invitations to players
- **palmares_table** - Leaderboard/statistics

Storage bucket: `escudos_equipo` - Team emblems (managed by captains)

## 🎯 Common Development Tasks

### Adding a New Page

1. Create Vue component in appropriate `src/pages/` subdirectory (e.g., `src/pages/public/NewPage.vue`)
2. Import in [src/router/index.js](src/router/index.js)
3. Add route definition with appropriate `meta` (title, requiresAuth, roles)
4. Link in Navbar or other navigation if needed

### Adding Data Fetching in a Component

```javascript
import { supabase } from "@/lib/supabase";

export default {
  async setup() {
    const { data, error } = await supabase
      .from("equipos")
      .select("*");
    return { data, error };
  }
}
```

Use `supabase.from(table).select()`, `.insert()`, `.update()`, `.delete()` as needed.

### Authentication Checks in Components

```javascript
import { useAuthStore } from "@/stores/auth";

export default {
  setup() {
    const authStore = useAuthStore();
    console.log(authStore.userRole); // 'admin', 'capitan', or 'jugador'
    console.log(authStore.isAdmin); // true/false
  }
}
```

### Adding a New Migration

1. Create `.sql` file in `supabase/` directory (name like `migration_feature_name.sql`)
2. Write DDL/DML to create/alter tables or data
3. Execute manually in Supabase dashboard SQL Editor (not automated yet)
4. Test in dev environment before production

## 🔐 Security Notes

- **RLS Policies**: All tables should have RLS enabled; policies restrict based on `auth.uid()` and user role
- **Public Read**: Public pages can read (SELECT) from tables that store display data (equipos, jugadores, palmares) due to RLS allowing public reads
- **Auth-Only Writes**: Only authenticated users can insert/update/delete via enforced RLS policies
- **Admin-Only Operations**: Some tables (gastos, some partidos) restricted to admin role via policy checks on `profiles.rol`
- **Env Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are public (safe for anon client), but still rotate regularly

## 🚨 Important Gotchas

1. **Auth Initialization**: Always await `authStore.initialize()` before checking `authStore.isAuthenticated` (router guard does this automatically via `router.beforeEach`)
2. **localStorage Persistence**: Auth data is persisted in localStorage; be aware when testing multiple accounts—clear localStorage to switch users manually
3. **Profile Creation**: When a user signs up, the profile is created via a Supabase trigger on `auth.users`. If the trigger fails, the user exists but profile doesn't—`getUserProfile()` will error
4. **Supabase Migrations**: No CI/CD automation; migrations must be run manually in the Supabase dashboard. Document the execution order in comments
5. **Vite Aliases**: `@` points to `src/`; use `@/components`, `@/stores`, etc. for imports
6. **Vercel Routing**: The SPA routing config in `vercel.json` is required for Vue Router to work; without it, direct URL visits fail with 404

## 📚 Key Dependencies

- **Vue 3** (v3.4.21) - UI framework
- **Vite** (v5.2.0) - Build tool & dev server
- **Vue Router** (v4.3.0) - Client-side routing
- **Pinia** (v2.1.7) - State management
- **@supabase/supabase-js** (v2.42.0) - Backend client
- **Tailwind CSS** (v3.4.1) - Styling
- **chart.js** + **vue-chartjs** - Data visualization
- **@headlessui/vue**, **@heroicons/vue** - UI components & icons
- **vue-cal** (v4.8.4) - Calendar widget

## 🔗 External Links

- **Supabase Console**: Credentials in `.env`; manage tables, auth, storage, RLS policies there
- **Vercel Dashboard**: Deployments, env vars, logs
- **README.md**: Higher-level project overview and user-facing documentation
