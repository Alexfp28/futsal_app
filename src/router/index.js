import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// Páginas públicas
import IdentidadPage from "@/pages/public/IdentidadPage.vue";
import EquiposPage from "@/pages/public/EquiposPage.vue";
import JugadoresLibresPage from "@/pages/public/JugadoresLibresPage.vue";
import ReglamentoPage from "@/pages/public/ReglamentoPage.vue";
import CodigoConductaPage from "@/pages/public/CodigoConductaPage.vue";
import EconomiaPage from "@/pages/public/EconomiaPage.vue";
import CalendarioPage from "@/pages/public/CalendarioPage.vue";
import RankingsPage from "@/pages/public/RankingsPage.vue";
import PalmaresPage from "@/pages/public/PalmaresPage.vue";
import SugerenciasPage from "@/pages/public/SugerenciasPage.vue";
import TraspasosPage from "@/pages/public/TraspasosPage.vue";
import InvitacionesPage from "@/pages/public/InvitacionesPage.vue";

// Páginas de autenticación
import LoginPage from "@/pages/auth/LoginPage.vue";
import RegisterPage from "@/pages/auth/RegisterPage.vue";

// Páginas de administrador
import AdminDashboard from "@/pages/admin/AdminDashboard.vue";
import AdminEquipos from "@/pages/admin/AdminEquipos.vue";
import AdminJugadores from "@/pages/admin/AdminJugadores.vue";
import AdminPartidos from "@/pages/admin/AdminPartidos.vue";
import AdminGastos from "@/pages/admin/AdminGastos.vue";

// Páginas de capitán
import CapitanDashboard from "@/pages/capitan/CapitanDashboard.vue";
import CapitanEquipo from "@/pages/capitan/CapitanEquipo.vue";

// Páginas de jugador
import JugadorPerfil from "@/pages/jugador/JugadorPerfil.vue";
import IntranetPage from "@/pages/intranet/IntranetPage.vue";

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
    path: "/jugadores-libres",
    name: "jugadores-libres",
    component: JugadoresLibresPage,
    meta: { title: "Jugadores Libres - FutSal La Vall" },
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
      guest: true,
    },
  },
  {
    path: "/rankings",
    name: "rankings",
    component: RankingsPage,
    meta: {
      title: "Rankings - FutSal La Vall",
      guest: true,
    },
  },
  {
    path: "/palmares",
    name: "palmares",
    component: PalmaresPage,
    meta: {
      title: "Palmarés - FutSal La Vall",
      guest: true,
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
      guest: true,
    },
  },
  {
    path: "/invitaciones",
    name: "invitaciones",
    component: InvitacionesPage,
    meta: {
      title: "Invitaciones - FutSal La Vall",
      guest: true,
    },
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

  // Si no está inicializado, inicializar y esperar a que termine
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

export default router;
