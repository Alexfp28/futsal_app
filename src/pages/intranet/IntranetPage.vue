<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import ClasificacionTable from "@/components/intranet/ClasificacionTable.vue";
import CalendarioIntranet from "@/components/intranet/CalendarioIntranet.vue";
import RankingsPage from "@/pages/public/RankingsPage.vue";
import TournamentBracket from "@/components/intranet/TournamentBracket.vue";
import {
  SparklesIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();

const tabs = [
  { id: "clasificacion", label: "Clasificación", icon: ShieldCheckIcon },
  {
    id: "calendario",
    label: "Calendario y Próximos Partidos",
    icon: CheckCircleIcon,
  },
  { id: "rankings", label: "Rankings de Jugadores", icon: UserGroupIcon },
  { id: "torneo", label: "Torneo", icon: SparklesIcon },
];

const activeTab = ref("clasificacion");

const userRoleLabel = computed(() => {
  if (authStore.isAdmin) return "Administrador";
  if (authStore.isCapitan) return "Capitán";
  if (authStore.isJugador) return "Jugador";
  return "Usuario";
});
</script>

<template>
  <div>
    <!-- Hero Header Section -->
    <section
      class="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700/90 text-white overflow-hidden pt-12 pb-20 md:pt-16 md:pb-24"
    >
      <!-- SVG Pattern de cancha -->
      <svg
        class="absolute inset-0 w-full h-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="court-pattern"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="80"
              height="80"
              fill="none"
              stroke="white"
              stroke-width="0.5"
            />
            <circle
              cx="40"
              cy="40"
              r="20"
              fill="none"
              stroke="white"
              stroke-width="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#court-pattern)" />
      </svg>

      <!-- Blur orbs decorativos -->
      <div
        class="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute -bottom-10 right-0 w-80 h-80 bg-secondary/15 rounded-full blur-3xl"
      ></div>

      <!-- Contenido header -->
      <div class="page-container relative z-10">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <!-- Left side -->
          <div class="flex-1">
            <h1 class="text-5xl md:text-6xl font-black leading-tight mb-4">
              Panel Interno
            </h1>
            <p class="text-lg text-white/80 max-w-xl leading-relaxed">
              Accede a toda la información de la competición: clasificación,
              calendario de partidos, rankings de jugadores y torneo.
            </p>
          </div>

          <!-- Right side - User Card -->
          <div
            class="md:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 transition-all duration-500 hover:bg-white/15 hover:border-white/30"
          >
            <div class="flex items-center gap-4 mb-5">
              <div
                class="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center text-3xl font-black text-secondary border border-secondary/30"
              >
                {{ (authStore.userName || "U")?.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white font-bold text-base truncate">
                  {{ authStore.userName || "Usuario" }}
                </p>
                <p class="text-white/60 text-xs mt-1">{{ userRoleLabel }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-if="authStore.isAdmin"
                class="px-3 py-2 rounded-lg bg-primary/20 border border-primary/30 text-xs font-semibold text-center"
              >
                🔐 Acceso administrador
              </div>
              <div
                v-else-if="authStore.isCapitan"
                class="px-3 py-2 rounded-lg bg-secondary/20 border border-secondary/30 text-secondary text-xs font-semibold text-center"
              >
                ⚽ Acceso capitán
              </div>
              <div
                v-else-if="authStore.isJugador"
                class="px-3 py-2 rounded-lg bg-tertiary/20 border border-tertiary/30 text-tertiary text-xs font-semibold text-center"
              >
                👤 Acceso jugador
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tabs Navigation -->
    <section
      class="border-b border-notion-border/60 bg-white sticky top-0 z-40"
    >
      <div class="page-container">
        <nav
          class="flex gap-1 overflow-x-auto"
          aria-label="Pestañas de intranet"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            @click="activeTab = tab.id"
            :class="[
              'group relative px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2',
              activeTab === tab.id
                ? 'text-primary'
                : 'text-notion-muted hover:text-notion-text',
            ]"
          >
            <component
              :is="tab.icon"
              :class="[
                'w-4 h-4 transition-transform duration-300',
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-notion-muted group-hover:text-notion-text',
              ]"
            />
            {{ tab.label }}

            <!-- Underline animation -->
            <div
              :class="[
                'absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-primary-400 to-secondary transition-all duration-300',
                activeTab === tab.id ? 'w-full' : 'w-0 group-hover:w-1/2',
              ]"
            ></div>
          </button>
        </nav>
      </div>
    </section>

    <!-- Content Sections -->
    <section class="bg-white py-12 md:py-16">
      <div class="page-container">
        <!-- Clasificación -->
        <div v-show="activeTab === 'clasificacion'" class="tab-section">
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-3">
              <span class="w-1 h-6 bg-primary rounded-full"></span>
              <h2 class="text-3xl md:text-4xl font-bold text-notion-text">
                Tabla de Clasificación
              </h2>
            </div>
            <p class="text-notion-muted max-w-2xl">
              Resumen de rendimiento de los equipos en la competición.
              <span v-if="authStore.isAdmin" class="block mt-1 text-xs">
                Como administrador, puedes gestionar equipos y partidos desde
                los paneles de administración.
              </span>
            </p>
          </div>

          <div
            class="bg-gradient-to-br from-notion-bg/60 to-primary-50/30 rounded-2xl border border-notion-border/40 p-8 backdrop-blur-sm"
          >
            <ClasificacionTable />
          </div>
        </div>

        <!-- Calendario -->
        <div v-show="activeTab === 'calendario'" class="tab-section">
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-3">
              <span class="w-1 h-6 bg-primary rounded-full"></span>
              <h2 class="text-3xl md:text-4xl font-bold text-notion-text">
                Calendario y Próximos Partidos
              </h2>
            </div>
            <p class="text-notion-muted max-w-2xl">
              Consulta la agenda completa de partidos, utiliza los filtros por
              día y localiza rápidamente los encuentros de tu equipo.
            </p>
          </div>

          <div
            class="bg-gradient-to-br from-notion-bg/60 to-primary-50/30 rounded-2xl border border-notion-border/40 p-8 backdrop-blur-sm"
          >
            <CalendarioIntranet />
          </div>
        </div>

        <!-- Rankings -->
        <div v-show="activeTab === 'rankings'" class="tab-section">
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-3">
              <span class="w-1 h-6 bg-primary rounded-full"></span>
              <h2 class="text-3xl md:text-4xl font-bold text-notion-text">
                Rankings de Jugadores
              </h2>
            </div>
            <p class="text-notion-muted max-w-2xl">
              Consulta el rendimiento de los jugadores según las estadísticas
              registradas en cada partido.
            </p>
          </div>

          <div
            class="bg-gradient-to-br from-notion-bg/60 to-secondary-50/20 rounded-2xl border border-notion-border/40 p-8 backdrop-blur-sm overflow-hidden"
          >
            <RankingsPage :hide-header="true" />
          </div>
        </div>

        <!-- Torneo -->
        <div v-show="activeTab === 'torneo'" class="tab-section">
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-3">
              <span class="w-1 h-6 bg-primary rounded-full"></span>
              <h2 class="text-3xl md:text-4xl font-bold text-notion-text">
                Torneo Eliminatorio
              </h2>
            </div>
            <p class="text-notion-muted max-w-2xl">
              Visualiza el cuadro del torneo y realiza el sorteo aleatorio de
              posiciones para los equipos participantes.
            </p>
          </div>

          <div
            class="bg-gradient-to-br from-notion-bg/60 to-tertiary-50/20 rounded-2xl border border-notion-border/40 p-8 backdrop-blur-sm"
          >
            <TournamentBracket />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Smooth page transitions */
.page-container {
  @apply transition-all duration-700 ease-out;
}

/* Tab content fade-in animation */
@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-section {
  animation: tabFadeIn 0.35s ease-out;
}

/* Tabs animation */
nav button {
  position: relative;
}

nav button::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background: linear-gradient(
    to right,
    var(--color-primary),
    var(--color-secondary)
  );
  transition: width 0.3s ease-out;
}

nav button.active::after,
nav button:hover::after {
  width: 100%;
}

/* Subtle hover effects on cards */
:deep(.card) {
  @apply transition-all duration-300 hover:shadow-lg;
}

/* User card glow effect on hover */
div[class*="bg-white/10"] {
  @apply transition-all duration-500;
}

div[class*="bg-white/10"]:hover {
  box-shadow: 0 0 30px rgba(22, 75, 240, 0.15);
}

/* Tab underline accent */
nav button:active,
nav button.router-link-active {
  @apply text-primary;
}

/* Responsive text sizing */
@media (max-width: 768px) {
  h2 {
    @apply text-2xl;
  }

  p {
    @apply text-sm;
  }
}

/* Smooth color transitions */
* {
  @apply transition-colors duration-300;
}
</style>
