<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  ListBulletIcon,
} from "@heroicons/vue/24/outline";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const partidos = ref([]);
const loading = ref(true);
const onlyMyTeam = ref(false);
const selectedDate = ref("");
const currentDate = ref(new Date());
const currentPage = ref(1);
const partidosPerPage = 6;
const selectedPartido = ref(null);
const isModalOpen = ref(false);
const viewMode = ref("calendario"); // 'calendario' | 'lista'

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

const partidosParaMostrar = computed(() => {
  if (selectedDate.value) {
    return partidosPorFecha.value;
  }
  return partidosFiltrados.value;
});

watch([selectedDate, onlyMyTeam], () => {
  currentPage.value = 1;
});

watch(
  partidosParaMostrar,
  (matches) => {
    if (!matches.length) {
      currentPage.value = 1;
      return;
    }

    const availablePages = Math.max(
      1,
      Math.ceil(matches.length / partidosPerPage),
    );
    if (currentPage.value > availablePages) {
      currentPage.value = availablePages;
    }
  },
  { immediate: true },
);

const currentMonth = computed(() =>
  currentDate.value.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  }),
);

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  for (let i = startPadding; i > 0; i--) {
    days.push({
      date: new Date(year, month, 1 - i),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  const endPadding = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= endPadding; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return days;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(partidosParaMostrar.value.length / partidosPerPage)),
);

const paginatedPartidos = computed(() => {
  const start = (currentPage.value - 1) * partidosPerPage;
  return partidosParaMostrar.value.slice(start, start + partidosPerPage);
});

const openPartidoModal = (partido) => {
  selectedPartido.value = partido;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  setTimeout(() => {
    selectedPartido.value = null;
  }, 200);
};

const prevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1,
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1,
  );
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
  }
};

const setToday = () => {
  const today = new Date();
  selectedDate.value = today.toISOString().slice(0, 10);
  currentDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
};

const clearDate = () => {
  selectedDate.value = "";
};

const selectCalendarDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  selectedDate.value = `${year}-${month}-${day}`;
  currentDate.value = new Date(year, date.getMonth(), 1);
};

const getPartidosForDay = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  return partidosFiltrados.value.filter((p) => p.fecha?.startsWith(dateStr));
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isSelectedDate = (date) => {
  if (!selectedDate.value) return false;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return selectedDate.value === `${year}-${month}-${day}`;
};

const getGoogleMapsUrl = (lugar) => {
  if (!lugar) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`;
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

          <!-- Toggle de vista -->
          <div class="flex items-center rounded-lg border border-notion-border overflow-hidden">
            <button
              type="button"
              :class="[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                viewMode === 'calendario'
                  ? 'bg-primary text-white'
                  : 'text-notion-muted hover:bg-notion-bg',
              ]"
              @click="viewMode = 'calendario'"
              title="Vista calendario"
            >
              <CalendarDaysIcon class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Calendario</span>
            </button>
            <button
              type="button"
              :class="[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                viewMode === 'lista'
                  ? 'bg-primary text-white'
                  : 'text-notion-muted hover:bg-notion-bg',
              ]"
              @click="viewMode = 'lista'"
              title="Vista lista"
            >
              <ListBulletIcon class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      :class="[
        'grid grid-cols-1 gap-6',
        viewMode === 'calendario' ? 'xl:grid-cols-3' : '',
      ]"
    >
      <div
        v-show="viewMode === 'calendario'"
        :class="viewMode === 'calendario' ? 'xl:col-span-2' : ''"
      >
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-notion-text capitalize">
              {{ currentMonth }}
            </h3>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="p-2 rounded-lg border border-notion-border text-notion-text hover:bg-notion-bg transition-colors"
                @click="prevMonth"
                aria-label="Mes anterior"
              >
                <ChevronLeftIcon class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 rounded-lg border border-notion-border text-notion-text hover:bg-notion-bg transition-colors"
                @click="nextMonth"
                aria-label="Mes siguiente"
              >
                <ChevronRightIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <p class="text-xs text-notion-muted mb-4 flex flex-wrap items-center gap-3">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span> Programado
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-green-500"></span> Jugado
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-red-500"></span> Cancelado
            </span>
            <span class="text-notion-muted/80">
              Pulsa un día con partidos para filtrar el listado.
            </span>
          </p>

          <div v-if="loading" class="flex justify-center py-6">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
            ></div>
          </div>

          <template v-else>
            <div class="grid grid-cols-7 gap-1 mb-2">
              <div
                v-for="day in weekDays"
                :key="day"
                class="text-center text-xs sm:text-sm font-medium text-notion-muted py-2"
              >
                {{ day }}
              </div>
            </div>

            <div class="grid grid-cols-7 gap-1">
              <button
                v-for="day in daysInMonth"
                :key="day.date.toISOString()"
                type="button"
                @click="selectCalendarDate(day.date)"
                :class="[
                  'min-h-[82px] rounded-lg border p-2 text-left transition-colors',
                  day.isCurrentMonth ? 'bg-white' : 'bg-notion-bg/80',
                  isToday(day.date) ? 'ring-2 ring-primary/70' : '',
                  isSelectedDate(day.date) ? 'border-primary bg-primary/5' : 'border-notion-border',
                ]"
              >
                <div class="flex items-center justify-between gap-1">
                  <span
                    :class="[
                      'text-sm font-medium',
                      day.isCurrentMonth ? 'text-notion-text' : 'text-notion-muted',
                    ]"
                  >
                    {{ day.date.getDate() }}
                  </span>
                  <span
                    v-if="getPartidosForDay(day.date).length"
                    class="text-[10px] font-semibold text-primary"
                  >
                    {{ getPartidosForDay(day.date).length }}
                  </span>
                </div>

                <div class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="partido in getPartidosForDay(day.date).slice(0, 4)"
                    :key="partido.id"
                    :class="[
                      'w-2 h-2 rounded-full',
                      getPartidoColor(partido.estado),
                    ]"
                    :title="`${formatTime(partido.fecha)} - ${partido.equipo_local?.nombre} vs ${partido.equipo_visitante?.nombre}`"
                  ></span>
                  <span
                    v-if="getPartidosForDay(day.date).length > 4"
                    class="text-[10px] text-notion-muted"
                  >
                    +{{ getPartidosForDay(day.date).length - 4 }}
                  </span>
                </div>
              </button>
            </div>
          </template>
        </div>
      </div>

      <div :class="viewMode === 'calendario' ? 'xl:col-span-1' : ''">
        <div class="card p-5">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 class="text-lg font-semibold text-notion-text">
                {{ selectedDate ? "Partidos del día" : "Listado de partidos" }}
              </h3>
              <p class="text-xs text-notion-muted mt-1">
                {{
                  selectedDate
                    ? `${partidosParaMostrar.length} partido(s) para la fecha seleccionada`
                    : `${partidosParaMostrar.length} partido(s) encontrados`
                }}
              </p>
            </div>
            <span class="text-xs text-notion-muted">
              Página {{ currentPage }} / {{ totalPages }}
            </span>
          </div>

          <div
            v-if="loading"
            class="flex justify-center py-6"
          >
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
            ></div>
          </div>

          <div
            v-else-if="partidosParaMostrar.length === 0"
            class="py-4 text-sm text-notion-muted"
          >
            No hay partidos
            {{ selectedDate ? "para el día seleccionado." : "registrados." }}
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="partido in paginatedPartidos"
              :key="partido.id"
              type="button"
              @click="openPartidoModal(partido)"
              class="w-full text-left p-3 rounded-lg border border-notion-border bg-notion-bg hover:bg-primary/5 transition-colors"
            >
              <div class="flex items-center justify-between mb-1 text-xs">
                <span class="text-notion-muted">
                  {{ formatShortDate(partido.fecha) }}
                </span>
                <span class="font-medium text-primary">
                  {{ formatTime(partido.fecha) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm mb-1 gap-2">
                <span class="font-medium text-notion-text">
                  {{ partido.equipo_local?.nombre }}
                </span>
                <span class="text-xs text-notion-muted">vs</span>
                <span class="font-medium text-notion-text text-right">
                  {{ partido.equipo_visitante?.nombre }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center text-notion-muted min-w-0">
                  <MapPinIcon class="w-3 h-3 mr-1 shrink-0" />
                  <span class="truncate">{{ partido.lugar }}</span>
                </div>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white shrink-0',
                    getPartidoColor(partido.estado),
                  ]"
                >
                  {{ partido.estado }}
                </span>
              </div>
            </button>

            <div
              v-if="totalPages > 1"
              class="flex items-center justify-between pt-2"
            >
              <button
                type="button"
                class="px-3 py-2 rounded-lg border border-notion-border text-xs text-notion-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-notion-bg transition-colors"
                :disabled="currentPage === 1"
                @click="previousPage"
              >
                Anterior
              </button>
              <button
                type="button"
                class="px-3 py-2 rounded-lg border border-notion-border text-xs text-notion-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-notion-bg transition-colors"
                :disabled="currentPage === totalPages"
                @click="nextPage"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @keydown.esc="closeModal"
    >
      <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>

      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 id="modal-title" class="text-2xl font-bold text-notion-text">
                Resumen del partido
              </h3>
              <p class="text-sm text-notion-muted mt-1">
                {{ formatFullDate(selectedPartido?.fecha) }}
              </p>
            </div>
            <button
              type="button"
              class="p-1 hover:bg-notion-bg rounded-lg transition-colors"
              aria-label="Cerrar diálogo"
              @click="closeModal"
            >
              <XMarkIcon class="w-6 h-6 text-notion-muted" />
            </button>
          </div>

          <div
            class="flex items-center justify-center mb-6 p-4 bg-notion-bg rounded-xl"
          >
            <div class="flex-1 text-center">
              <div
                class="w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-lg font-bold"
                :style="{
                  backgroundColor:
                    selectedPartido?.equipo_local?.color_principal || '#164bf0',
                }"
              >
                {{ selectedPartido?.equipo_local?.nombre?.charAt(0) || "L" }}
              </div>
              <p class="font-semibold text-notion-text">
                {{ selectedPartido?.equipo_local?.nombre || "Equipo local" }}
              </p>
            </div>

            <div class="mx-4 text-center">
              <p class="text-2xl font-bold text-notion-muted">VS</p>
              <span
                :class="[
                  'inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium text-white',
                  getPartidoColor(selectedPartido?.estado),
                ]"
              >
                {{ selectedPartido?.estado }}
              </span>
            </div>

            <div class="flex-1 text-center">
              <div
                class="w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-lg font-bold"
                :style="{
                  backgroundColor:
                    selectedPartido?.equipo_visitante?.color_principal ||
                    '#dc2626',
                }"
              >
                {{ selectedPartido?.equipo_visitante?.nombre?.charAt(0) || "V" }}
              </div>
              <p class="font-semibold text-notion-text">
                {{
                  selectedPartido?.equipo_visitante?.nombre ||
                  "Equipo visitante"
                }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div class="flex items-center p-3 rounded-lg bg-notion-bg">
              <ClockIcon class="w-5 h-5 text-primary mr-3" />
              <div>
                <p class="text-xs text-notion-muted">Hora</p>
                <p class="font-medium text-notion-text">
                  {{ formatTime(selectedPartido?.fecha) }}
                </p>
              </div>
            </div>
            <div class="flex items-center p-3 rounded-lg bg-notion-bg">
              <MapPinIcon class="w-5 h-5 text-primary mr-3" />
              <div class="min-w-0">
                <p class="text-xs text-notion-muted">Lugar</p>
                <p class="font-medium text-notion-text truncate">
                  {{ selectedPartido?.lugar || "Por confirmar" }}
                </p>
              </div>
            </div>
          </div>

          <a
            v-if="selectedPartido?.lugar"
            :href="getGoogleMapsUrl(selectedPartido.lugar)"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-4 flex items-center justify-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary font-medium transition-colors"
          >
            <MapPinIcon class="w-5 h-5" />
            <span>Abrir en Google Maps</span>
            <ArrowTopRightOnSquareIcon class="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

