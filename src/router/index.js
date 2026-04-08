import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// Páginas públicas
const IdentidadPage = () => import("@/pages/public/IdentidadPage.vue");
const EquiposPage = () => import("@/pages/public/EquiposPage.vue");
const ReglamentoPage = () => import("@/pages/public/ReglamentoPage.vue");
const CodigoConductaPage = () =>
  import("@/pages/public/CodigoConductaPage.vue");
const EconomiaPage = () => import("@/pages/public/EconomiaPage.vue");
const CalendarioPage = () => import("@/pages/public/CalendarioPage.vue");
const RankingsPage = () => import("@/pages/public/RankingsPage.vue");
const PalmaresPage = () => import("@/pages/public/PalmaresPage.vue");
const SugerenciasPage = () => import("@/pages/public/SugerenciasPage.vue");
const TraspasosPage = () => import("@/pages/public/TraspasosPage.vue");
const AvisosPage = () => import("@/pages/public/AvisosPage.vue");

// Páginas de autenticación
const LoginPage = () => import("@/pages/auth/LoginPage.vue");
const RegisterPage = () => import("@/pages/auth/RegisterPage.vue");

// Páginas de administrador
const AdminDashboard = () => import("@/pages/admin/AdminDashboard.vue");
const AdminEquipos = () => import("@/pages/admin/AdminEquipos.vue");
const AdminJugadores = () => import("@/pages/admin/AdminJugadores.vue");
const AdminPartidos = () => import("@/pages/admin/AdminPartidos.vue");
const AdminGastos = () => import("@/pages/admin/AdminGastos.vue");
const AdminAvisosPage = () => import("@/pages/admin/AdminAvisosPage.vue");

// Páginas de capitán
const CapitanDashboard = () => import("@/pages/capitan/CapitanDashboard.vue");
const CapitanEquipo = () => import("@/pages/capitan/CapitanEquipo.vue");

// Páginas de jugador
const JugadorPerfil = () => import("@/pages/jugador/JugadorPerfil.vue");
const IntranetPage = () => import("@/pages/intranet/IntranetPage.vue");

const routes = [
  // Rutas públicas
  {
    path: "/",
    name: "home",
    component: IdentidadPage,
    meta: { title: "Inicio - FutSal La Vall" },
  },
  {
    path: "/identidad",
    name: "identidad",
    component: IdentidadPage,
    meta: { title: "Identidad - FutSal La Vall" },
  },
  {
    path: "/equipos",
    name: "equipos",
    component: EquiposPage,
    meta: { title: "Equipos - FutSal La Vall" },
  },
  {
    path: "/reglamento",
    name: "reglamento",
    component: ReglamentoPage,
    meta: { title: "Reglamento - FutSal La Vall" },
  },
  {
    path: "/codigo-conducta",
    name: "codigo-conducta",
    component: CodigoConductaPage,
    meta: { title: "Código de Conducta - FutSal La Vall" },
  },
  {
    path: "/economia",
    name: "economia",
    component: EconomiaPage,
    meta: { title: "Economía y Transparencia - FutSal La Vall" },
  },
  {
    path: "/calendario",
    name: "calendario",
    component: CalendarioPage,
    meta: {
      title: "Calendario - FutSal La Vall",
    },
  },
  {
    path: "/rankings",
    name: "rankings",
    component: RankingsPage,
    meta: {
      title: "Rankings - FutSal La Vall",
    },
  },
  {
    path: "/palmares",
    name: "palmares",
    component: PalmaresPage,
    meta: {
      title: "Palmarés - FutSal La Vall",
    },
  },
  {
    path: "/sugerencias",
    name: "sugerencias",
    component: SugerenciasPage,
    meta: {
      title: "Sugerencias - FutSal La Vall",
    },
  },
  {
    path: "/traspasos",
    name: "traspasos",
    component: TraspasosPage,
    meta: {
      title: "Mercado de Fichajes - FutSal La Vall",
    },
  },
  {
    path: "/avisos",
    name: "avisos",
    component: AvisosPage,
    meta: { title: "Avisos - FutSal La Vall" },
  },
  // Rutas de autenticación
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: { title: "Iniciar Sesión - FutSal La Vall", guest: true },
  },
  {
    path: "/registro",
    name: "registro",
    component: RegisterPage,
    meta: { title: "Registro - FutSal La Vall", guest: true },
  },

  // Rutas de administrador
  {
    path: "/admin",
    name: "admin-dashboard",
    component: AdminDashboard,
    meta: {
      title: "Panel de Administrador - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin"],
    },
  },
  {
    path: "/admin/equipos",
    name: "admin-equipos",
    component: AdminEquipos,
    meta: {
      title: "Gestionar Equipos - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin"],
    },
  },
  {
    path: "/admin/jugadores",
    name: "admin-jugadores",
    component: AdminJugadores,
    meta: {
      title: "Gestionar Jugadores - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin"],
    },
  },
  {
    path: "/admin/partidos",
    name: "admin-partidos",
    component: AdminPartidos,
    meta: {
      title: "Gestionar Partidos - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin"],
    },
  },
  {
    path: "/admin/gastos",
    name: "admin-gastos",
    component: AdminGastos,
    meta: {
      title: "Gestionar Gastos - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin"],
    },
  },
  {
    path: "/admin/avisos",
    name: "admin-avisos",
    component: AdminAvisosPage,
    meta: {
      title: "Gestión Avisos - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin"],
    },
  },

  // Rutas de capitán
  {
    path: "/capitan",
    name: "capitan-dashboard",
    component: CapitanDashboard,
    meta: {
      title: "Panel de Capitán - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin", "capitan"],
    },
  },
  {
    path: "/capitan/equipo",
    name: "capitan-equipo",
    component: CapitanEquipo,
    meta: {
      title: "Mi Equipo - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin", "capitan"],
    },
  },

  // Rutas de jugador
  {
    path: "/perfil",
    name: "perfil",
    component: JugadorPerfil,
    meta: {
      title: "Mi Perfil - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin", "capitan", "jugador"],
    },
  },

  // Ruta de intranet (home interna para usuarios autenticados)
  {
    path: "/intranet",
    name: "intranet",
    component: IntranetPage,
    meta: {
      title: "Intranet - FutSal La Vall",
      requiresAuth: true,
      roles: ["admin", "capitan", "jugador"],
    },
  },

  // Ruta 404
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Guard de navegación para autenticación y roles
router.beforeEach(async (to, from, next) => {
  const meta = to.meta || {};

  // Actualizar título de la página
  document.title = meta.title || "FutSal La Vall";

  const authStore = useAuthStore();

  // Rutas públicas (sin requiresAuth ni guest): arrancar inicialización sin bloquear.
  // La hidratación desde localStorage es inmediata; la verificación con Supabase
  // ocurre en background y Vue reaccionará si cambia el estado.
  if (!meta.requiresAuth && !meta.guest) {
    if (!authStore.initialized) {
      authStore.initialize();
    }
    return next();
  }

  // Rutas protegidas o de invitado: necesitamos el estado de auth para decidir
  if (!authStore.initialized) {
    await authStore.initialize();
  }

  // Verificar si la ruta requiere autenticación
  if (meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next({ name: "login", query: { redirect: to.fullPath } });
    }

    // Verificar roles permitidos
    const allowedRoles = meta.roles || [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(authStore.userRole)) {
      return next({ name: "home" });
    }
  }

  // Verificar si la ruta es solo para invitados (no autenticados)
  if (meta.guest && authStore.isAuthenticated) {
    return next({ name: "intranet" });
  }

  next();
});

// Hook para limpiar estado después de cada navegación
router.afterEach((to, from) => {
  // Forzar que los componentes se recargen sus datos
  // Esto es especialmente importante para navegación hacia atrás del navegador
  window.dispatchEvent(new CustomEvent("route-change", { detail: { to, from } }));
});

export default router;
