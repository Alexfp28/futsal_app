<script setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
} from "@heroicons/vue/24/outline";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const partidos = ref([]);
const loading = ref(true);
const selectedPartidoId = ref(null);
const onlyMyTeam = ref(false);
const selectedDate = ref("");

const fetchPartidos = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("partidos")
      .select(
        "*, equipo_local:equipos!partidos_equipo_local_id_fkey(id, nombre, escudo_url, color_principal), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(id, nombre, escudo_url, color_principal)",
      )
      .order("fecha");

    if (error) throw error;
    partidos.value = data || [];
  } catch (e) {
    console.error("Error cargando partidos (intranet):", e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPartidos);

const formatTime = (fecha) =>
  new Date(fecha).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatShortDate = (fecha) =>
  new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const formatFullDate = (fecha) =>
  new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const getPartidoColor = (estado) => {
  switch (estado) {
    case "programado":
      return "bg-blue-500";
    case "jugado":
      return "bg-green-500";
    case "cancelado":
      return "bg-red-500";
    default:
      return "bg-primary";
  }
};

const partidosOrdenados = computed(() =>
  [...partidos.value].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  ),
);

const partidosFiltrados = computed(() => {
  if (!onlyMyTeam.value || !authStore.profile?.equipo_id) {
    return partidosOrdenados.value;
  }

  const equipoId = authStore.profile.equipo_id;
  return partidosOrdenados.value.filter(
    (p) =>
      p.equipo_local_id === equipoId || p.equipo_visitante_id === equipoId,
  );
});

const partidosPorFecha = computed(() => {
  if (!selectedDate.value) {
    return partidosFiltrados.value;
  }

  const dateStr = selectedDate.value;
  return partidosFiltrados.value.filter((p) => p.fecha?.startsWith(dateStr));
});

const proximosPartidos = computed(() => {
  const now = new Date().toISOString();
  return partidosFiltrados.value.filter((p) => p.fecha >= now).slice(0, 8);
});

const partidosParaMostrar = computed(() => {
  if (selectedDate.value) {
    return partidosPorFecha.value;
  }
  return proximosPartidos.value;
});

const selectedPartido = computed(() =>
  partidosFiltrados.value.find((p) => p.id === selectedPartidoId.value) ||
  null,
);

const selectPartido = (partido) => {
  selectedPartidoId.value = partido.id;
};

const setToday = () => {
  const today = new Date();
  selectedDate.value = today.toISOString().slice(0, 10);
};

const clearDate = () => {
  selectedDate.value = "";
};
</script>

<template>
  <div class="space-y-4">
    <!-- Filtros -->
    <div class="card p-4">
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div class="space-y-1">
          <p class="text-sm font-medium text-notion-text">
            Filtros de partidos
          </p>
          <p class="text-xs text-notion-muted">
            Elige un día concreto o revisa los próximos partidos programados.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label
            v-if="authStore.profile?.equipo_id"
            class="inline-flex items-center gap-2 cursor-pointer text-xs"
          >
            <input
              v-model="onlyMyTeam"
              type="checkbox"
              class="rounded border-notion-border text-primary focus:ring-primary"
            />
            <span>Solo partidos de mi equipo</span>
          </label>

          <div class="flex items-center gap-2 text-xs">
            <input
              v-model="selectedDate"
              type="date"
              class="border border-notion-border rounded-lg px-2 py-1 text-xs text-notion-text bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <button
              type="button"
              class="px-2 py-1 rounded-lg border border-notion-border text-xs text-notion-text hover:bg-notion-bg"
              @click="setToday"
            >
              Hoy
            </button>
            <button
              type="button"
              class="px-2 py-1 rounded-lg text-xs text-notion-muted hover:bg-notion-bg"
              @click="clearDate"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de partidos -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2">
        <div class="card p-5">
          <h3 class="text-lg font-semibold text-notion-text mb-3">
            {{ selectedDate ? "Partidos del día seleccionado" : "Próximos partidos" }}
          </h3>

          <p class="text-xs text-notion-muted mb-3 flex items-center gap-3">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span> Programado
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-green-500"></span> Jugado
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-red-500"></span> Cancelado
            </span>
          </p>

          <div v-if="loading" class="flex justify-center py-6">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
            ></div>
          </div>

          <div
            v-else-if="partidosParaMostrar.length === 0"
            class="py-4 text-sm text-notion-muted"
          >
            No hay partidos
            {{ selectedDate ? "para el día seleccionado." : "próximos programados." }}
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="partido in partidosParaMostrar"
              :key="partido.id"
              type="button"
              @click="selectPartido(partido)"
              :class="[
                'w-full text-left p-3 rounded-lg border transition-colors',
                selectedPartido?.id === partido.id
                  ? 'border-primary bg-primary/5'
                  : 'border-notion-border bg-notion-bg hover:bg-primary/5',
              ]"
            >
              <div class="flex items-center justify-between mb-1 text-xs">
                <span class="text-notion-muted">
                  {{ formatShortDate(partido.fecha) }}
                </span>
                <span class="font-medium text-primary">
                  {{ formatTime(partido.fecha) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="font-medium text-notion-text">
                  {{ partido.equipo_local?.nombre }}
                </span>
                <span class="text-xs text-notion-muted">vs</span>
                <span class="font-medium text-notion-text">
                  {{ partido.equipo_visitante?.nombre }}
                </span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center text-notion-muted">
                  <MapPinIcon class="w-3 h-3 mr-1" />
                  <span class="truncate">{{ partido.lugar }}</span>
                </div>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white',
                    getPartidoColor(partido.estado),
                  ]"
                >
                  {{ partido.estado }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Detalle del partido -->
      <div class="xl:col-span-1 space-y-4">
        <div v-if="selectedPartido" class="card p-5">
          <h3
            class="text-sm font-semibold text-notion-text mb-3 flex items-center gap-2"
          >
            <UsersIcon class="w-4 h-4 text-primary" />
            Detalle del partido
          </h3>

          <p class="text-xs text-notion-muted mb-3">
            {{ formatFullDate(selectedPartido.fecha) }}
          </p>

          <div
            class="flex items-center justify-between mb-4 p-3 rounded-lg bg-notion-bg"
          >
            <div class="flex-1 text-center">
              <div
                class="w-10 h-10 mx-auto mb-1 rounded-full flex items-center justify-center text-white text-sm font-bold"
                :style="{
                  backgroundColor:
                    selectedPartido.equipo_local?.color_principal || '#164bf0',
                }"
              >
                {{ selectedPartido.equipo_local?.nombre?.charAt(0) || "L" }}
              </div>
              <p class="text-xs font-medium text-notion-text truncate">
                {{ selectedPartido.equipo_local?.nombre || "Equipo local" }}
              </p>
            </div>

            <div class="mx-3 text-center">
              <p class="text-xs text-notion-muted mb-1">vs</p>
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white',
                  getPartidoColor(selectedPartido.estado),
                ]"
              >
                {{ selectedPartido.estado }}
              </span>
            </div>

            <div class="flex-1 text-center">
              <div
                class="w-10 h-10 mx-auto mb-1 rounded-full flex items-center justify-center text-white text-sm font-bold"
                :style="{
                  backgroundColor:
                    selectedPartido.equipo_visitante?.color_principal ||
                    '#dc2626',
                }"
              >
                {{ selectedPartido.equipo_visitante?.nombre?.charAt(0) || "V" }}
              </div>
              <p class="text-xs font-medium text-notion-text truncate">
                {{
                  selectedPartido.equipo_visitante?.nombre || "Equipo visitante"
                }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="flex items-center p-2 rounded-lg bg-notion-bg">
              <ClockIcon class="w-4 h-4 text-primary mr-2" />
              <div>
                <p class="text-[11px] text-notion-muted">Hora</p>
                <p class="font-medium text-notion-text">
                  {{ formatTime(selectedPartido.fecha) }}
                </p>
              </div>
            </div>
            <div class="flex items-center p-2 rounded-lg bg-notion-bg">
              <MapPinIcon class="w-4 h-4 text-primary mr-2" />
              <div>
                <p class="text-[11px] text-notion-muted">Lugar</p>
                <p class="font-medium text-notion-text">
                  {{ selectedPartido.lugar }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card p-5 text-xs text-notion-muted">
          Selecciona un partido de la lista para ver el detalle.
        </div>
      </div>
    </div>
  </div>
</template>

