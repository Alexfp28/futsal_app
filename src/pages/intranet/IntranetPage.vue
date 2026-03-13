<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import ClasificacionTable from "@/components/intranet/ClasificacionTable.vue";
import CalendarioIntranet from "@/components/intranet/CalendarioIntranet.vue";
import RankingsPage from "@/pages/public/RankingsPage.vue";
import TournamentBracket from "@/components/intranet/TournamentBracket.vue";

const authStore = useAuthStore();

const tabs = [
  { id: "clasificacion", label: "Clasificación" },
  { id: "calendario", label: "Calendario y Próximos Partidos" },
  { id: "rankings", label: "Rankings de Jugadores" },
  { id: "torneo", label: "Torneo" },
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
  <div class="page-container">
    <!-- Encabezado -->
    <div
      class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 class="page-title mb-2">Panel interno</h1>
        <p class="page-subtitle mb-0">
          Accede a la información interna de la organización: clasificación,
          calendario y rankings.
        </p>
      </div>

      <div class="flex flex-col items-start md:items-end gap-2">
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-sm font-medium text-notion-text">
              {{ authStore.userName || "Usuario" }}
            </p>
            <p class="text-xs text-notion-muted">
              {{ userRoleLabel }}
            </p>
          </div>
          <span class="badge badge-primary capitalize">
            {{ authStore.userRole }}
          </span>
        </div>
        <div class="flex flex-wrap gap-2 text-xs text-notion-muted">
          <span v-if="authStore.isAdmin" class="badge badge-success">
            Acceso administrador
          </span>
          <span v-else-if="authStore.isCapitan" class="badge badge-secondary">
            Acceso capitán
          </span>
          <span v-else-if="authStore.isJugador" class="badge badge-secondary">
            Acceso jugador
          </span>
        </div>
      </div>
    </div>

    <!-- Pestañas -->
    <div class="mb-6 border-b border-notion-border">
      <nav
        class="-mb-px flex flex-wrap gap-4"
        aria-label="Pestañas de intranet"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          @click="activeTab = tab.id"
          :class="[
            'whitespace-nowrap border-b-2 px-3 pb-3 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-notion-muted hover:text-notion-text hover:border-notion-border',
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Contenido de pestañas -->
    <div class="space-y-6">
      <!-- Clasificación -->
      <section
        v-if="activeTab === 'clasificacion'"
        aria-label="Clasificación general"
      >
        <div class="card p-6">
          <h2 class="text-xl font-semibold text-notion-text mb-2">
            Tabla de clasificación
          </h2>
          <p class="text-sm text-notion-muted mb-4">
            Resumen de rendimiento de los equipos en la competición.
            <span v-if="authStore.isAdmin" class="ml-1">
              Como administrador puedes gestionar equipos y partidos desde los
              paneles de administración.
            </span>
          </p>

          <ClasificacionTable />
        </div>
      </section>

      <!-- Calendario -->
      <section
        v-else-if="activeTab === 'calendario'"
        aria-label="Calendario y próximos partidos"
      >
        <div class="space-y-4">
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div>
              <h2 class="text-xl font-semibold text-notion-text">
                Calendario y próximos partidos
              </h2>
              <p class="text-sm text-notion-muted">
                Consulta la agenda de partidos, utiliza el filtro por día y
                localiza rápidamente los encuentros de tu equipo.
              </p>
            </div>
          </div>

          <CalendarioIntranet />
        </div>
      </section>

      <!-- Rankings -->
      <section
        v-else-if="activeTab === 'rankings'"
        aria-label="Rankings de jugadores"
      >
        <div class="space-y-3">
          <div>
            <h2 class="text-xl font-semibold text-notion-text mb-1">
              Rankings de jugadores
            </h2>
            <p class="text-sm text-notion-muted">
              Consulta el rendimiento de los jugadores según las estadísticas
              registradas por partido.
            </p>
          </div>

          <RankingsPage :hide-header="true" />
        </div>
      </section>

      <!-- Torneo -->
      <section v-else-if="activeTab === 'torneo'" aria-label="Cuadro de torneo">
        <div class="space-y-3">
          <div>
            <h2 class="text-xl font-semibold text-notion-text mb-1">
              Torneo eliminatorio
            </h2>
            <p class="text-sm text-notion-muted">
              Visualiza el cuadro del torneo y realiza el sorteo aleatorio de
              posiciones para los equipos participantes.
            </p>
          </div>

          <TournamentBracket />
        </div>
      </section>
    </div>
  </div>
</template>
