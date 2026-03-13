<script setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/vue/24/outline";

const partidos = ref([]);
const loading = ref(true);
const currentDate = ref(new Date());
const selectedPartido = ref(null);
const isOpen = ref(false);
const convocatorias = ref({});

onMounted(async () => {
  try {
    // Cargar partidos con información de equipos
    const { data, err } = await supabase
      .from("partidos")
      .select(
        "*, equipo_local:equipos!partidos_equipo_local_id_fkey(id, nombre, escudo_url, color_principal), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(id, nombre, escudo_url, color_principal)",
      )
      .order("fecha");

    if (err) throw err;
    partidos.value = data || [];

    // Cargar todas las convocatorias
    await cargarConvocatorias();
  } catch (e) {
    console.error("Error cargando partidos:", e);
  } finally {
    loading.value = false;
  }
});

async function cargarConvocatorias() {
  try {
    const { data, error } = await supabase
      .from("convocatorias")
      .select(
        "*, jugador:profiles(id, nombre, posicion, numero_camiseta, foto_url, equipo_id, equipos:equipos(nombre))",
      )
      .order("es_suplente");

    if (error) throw error;

    // Organizar convocatorias por partido_id
    const convMap = {};
    data?.forEach((c) => {
      if (!convMap[c.partido_id]) {
        convMap[c.partido_id] = { principales: [], suplentes: [] };
      }
      if (c.es_suplente) {
        convMap[c.partido_id].suplentes.push(c);
      } else {
        convMap[c.partido_id].principales.push(c);
      }
    });
    convocatorias.value = convMap;
  } catch (e) {
    console.error("Error cargando convocatorias:", e);
  }
}

// Datos de ejemplo para cuando no hay partidos
const partidosEjemplo = [
  {
    id: "ejemplo-1",
    fecha: "2026-03-08T18:00:00",
    lugar: "Polideportivo Municipal",
    equipo_local: { nombre: "Los Tigres", color_principal: "#164bf0" },
    equipo_visitante: { nombre: "Águilas FC", color_principal: "#dc2626" },
    estado: "programado",
  },
  {
    id: "ejemplo-2",
    fecha: "2026-03-08T19:30:00",
    lugar: "Polideportivo Municipal",
    equipo_local: { nombre: "La Vall United", color_principal: "#16a34a" },
    equipo_visitante: {
      nombre: "Deportivo Juventud",
      color_principal: "#7c3aed",
    },
    estado: "programado",
  },
  {
    id: "ejemplo-3",
    fecha: "2026-03-15T18:00:00",
    lugar: "Pabellón San José",
    equipo_local: { nombre: "CF San José", color_principal: "#0ea5e9" },
    equipo_visitante: { nombre: "Los Tigres", color_principal: "#164bf0" },
    estado: "programado",
  },
  {
    id: "ejemplo-4",
    fecha: "2026-03-15T19:30:00",
    lugar: "Pabellón San José",
    equipo_local: { nombre: "Atlético Vall", color_principal: "#f97316" },
    equipo_visitante: { nombre: "La Vall United", color_principal: "#16a34a" },
    estado: "programado",
  },
  {
    id: "ejemplo-5",
    fecha: "2026-03-22T17:00:00",
    lugar: "Polideportivo Municipal",
    equipo_local: { nombre: "Águilas FC", color_principal: "#dc2626" },
    equipo_visitante: { nombre: "CF San José", color_principal: "#0ea5e9" },
    estado: "programado",
  },
  {
    id: "ejemplo-6",
    fecha: "2026-03-22T18:30:00",
    lugar: "Polideportivo Municipal",
    equipo_local: { nombre: "Deportivo Juventud", color_principal: "#7c3aed" },
    equipo_visitante: { nombre: "Atlético Vall", color_principal: "#f97316" },
    estado: "programado",
  },
  {
    id: "ejemplo-7",
    fecha: "2026-03-29T18:00:00",
    lugar: "Polideportivo Municipal",
    equipo_local: { nombre: "Los Tigres", color_principal: "#164bf0" },
    equipo_visitante: {
      nombre: "Deportivo Juventud",
      color_principal: "#7c3aed",
    },
    estado: "programado",
  },
  {
    id: "ejemplo-8",
    fecha: "2026-03-29T19:30:00",
    lugar: "Pabellón San José",
    equipo_local: { nombre: "La Vall United", color_principal: "#16a34a" },
    equipo_visitante: { nombre: "Águilas FC", color_principal: "#dc2626" },
    estado: "programado",
  },
  {
    id: "ejemplo-9",
    fecha: "2026-04-05T18:00:00",
    lugar: "Polideportivo Municipal",
    equipo_local: { nombre: "CF San José", color_principal: "#0ea5e9" },
    equipo_visitante: { nombre: "Atlético Vall", color_principal: "#f97316" },
    estado: "programado",
  },
];

const partidosActuales = computed(() =>
  partidos.value.length > 0 ? partidos.value : partidosEjemplo,
);

const currentMonth = computed(() => {
  return currentDate.value.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
});

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  // Días del mes anterior para completar la primera semana
  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  for (let i = startPadding; i > 0; i--) {
    const day = new Date(year, month, 1 - i);
    days.push({ date: day, isCurrentMonth: false });
  }

  // Días del mes actual
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Días del mes siguiente para completar la última semana
  const endPadding = 7 - (days.length % 7);
  if (endPadding < 7) {
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }

  return days;
});

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

const getPartidosForDay = (date) => {
  // Usar formato local para evitar problemas de zona horaria con UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  return partidosActuales.value.filter((p) => p.fecha.startsWith(dateStr));
};

const formatTime = (fecha) => {
  return new Date(fecha).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

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

const getPartidoEmoji = (estado) => {
  switch (estado) {
    case "programado":
      return "🔵";
    case "jugado":
      return "🟢";
    case "cancelado":
      return "🔴";
    default:
      return "⚪";
  }
};

const getEstadoLabel = (estado) => {
  switch (estado) {
    case "programado":
      return "Programado";
    case "jugado":
      return "Jugado";
    case "cancelado":
      return "Cancelado";
    default:
      return estado;
  }
};

// Generar enlace de Google Maps
const getGoogleMapsUrl = (lugar) => {
  if (!lugar) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`;
};

const getPosicionSpanish = (posicion) => {
  const posiciones = {
    Portero: "Portero",
    Defensa: "Defensa",
    Ala: "Ala",
    Cierre: "Cierre",
    Universal: "Universal",
  };
  return posiciones[posicion] || posicion;
};

function openPartidoModal(partido) {
  selectedPartido.value = partido;
  isOpen.value = true;
}

function closeModal() {
  isOpen.value = false;
  // Usar setTimeout para evitar el re-render inmediato
  setTimeout(() => {
    selectedPartido.value = null;
  }, 300);
}

const partidoConvocatorias = computed(() => {
  if (!selectedPartido.value) return { principales: [], suplentes: [] };
  return (
    convocatorias.value[selectedPartido.value.id] || {
      principales: [],
      suplentes: [],
    }
  );
});
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Calendario de Partidos</h1>
      <p class="page-subtitle">
        Consulta los partidos programados por la organización
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Calendario -->
        <div class="lg:col-span-2">
          <div class="card p-6">
            <!-- Header del calendario -->
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-notion-text capitalize">
                {{ currentMonth }}
              </h2>
              <div class="flex space-x-2">
                <button
                  @click="prevMonth"
                  class="p-2 hover:bg-notion-bg rounded-lg transition-colors"
                >
                  <ChevronLeftIcon class="w-5 h-5 text-notion-text" />
                </button>
                <button
                  @click="nextMonth"
                  class="p-2 hover:bg-notion-bg rounded-lg transition-colors"
                >
                  <ChevronRightIcon class="w-5 h-5 text-notion-text" />
                </button>
              </div>
            </div>

            <!-- Días de la semana -->
            <div class="grid grid-cols-7 gap-1 mb-2">
              <div
                v-for="day in weekDays"
                :key="day"
                class="text-center text-sm font-medium text-notion-muted py-2"
              >
                {{ day }}
              </div>
            </div>

            <!-- Días del mes -->
            <div class="grid grid-cols-7 gap-1">
              <div
                v-for="day in daysInMonth"
                :key="day.date.toISOString()"
                :class="[
                  'min-h-[80px] p-1 border border-notion-border rounded-lg transition-colors relative',
                  day.isCurrentMonth ? 'bg-white' : 'bg-notion-bg',
                  isToday(day.date) ? 'ring-2 ring-primary' : '',
                ]"
              >
                <span
                  :class="[
                    'text-sm font-medium',
                    day.isCurrentMonth
                      ? 'text-notion-text'
                      : 'text-notion-muted',
                  ]"
                >
                  {{ day.date.getDate() }}
                </span>

                <!-- Puntitos de partidos -->
                <div class="mt-1 flex flex-wrap gap-1">
                  <template
                    v-for="partido in getPartidosForDay(day.date)"
                    :key="partido.id"
                  >
                    <button
                      @click="openPartidoModal(partido)"
                      :title="`${formatTime(partido.fecha)} - ${partido.equipo_local?.nombre} vs ${partido.equipo_visitante?.nombre}`"
                      :class="[
                        'w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform',
                        getPartidoColor(partido.estado),
                      ]"
                    ></button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de partidos -->
        <div class="lg:col-span-1">
          <div class="card p-6">
            <h2 class="text-lg font-semibold text-notion-text mb-4">
              Próximos Partidos
            </h2>
            <div class="space-y-4">
              <div
                v-for="partido in partidosActuales.slice(0, 6)"
                :key="partido.id"
                @click="openPartidoModal(partido)"
                class="p-4 bg-notion-bg rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-notion-muted">
                    {{
                      new Date(partido.fecha).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                    }}
                  </span>
                  <span class="text-xs font-medium text-primary">
                    {{ formatTime(partido.fecha) }}
                  </span>
                </div>

                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-notion-text text-sm">{{
                    partido.equipo_local?.nombre
                  }}</span>
                  <span class="text-xs text-notion-muted">vs</span>
                  <span class="font-medium text-notion-text text-sm">{{
                    partido.equipo_visitante?.nombre
                  }}</span>
                </div>

                <div class="flex items-center text-xs text-notion-muted">
                  <MapPinIcon class="w-3 h-3 mr-1" />
                  <span>{{ partido.lugar }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal de Partido -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @keydown.esc="closeModal"
    >
      <!-- Fondo oscuro -->
      <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>

      <!-- Contenido del modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <!-- Header del modal -->
          <div class="flex justify-between items-start mb-6">
            <h3 id="modal-title" class="text-2xl font-bold text-notion-text">
              Detalles del Partido
            </h3>
            <button
              @click="closeModal"
              type="button"
              class="p-1 hover:bg-notion-bg rounded-lg transition-colors"
              aria-label="Cerrar modal"
            >
              <XMarkIcon class="w-6 h-6 text-notion-muted" />
            </button>
          </div>

          <!-- Equipos -->
          <div
            class="flex items-center justify-center mb-6 p-4 bg-notion-bg rounded-xl"
          >
            <div class="flex-1 text-center">
              <div
                class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-xl font-bold"
                :style="{
                  backgroundColor:
                    selectedPartido?.equipo_local?.color_principal || '#164bf0',
                }"
              >
                {{ selectedPartido?.equipo_local?.nombre?.charAt(0) || "L" }}
              </div>
              <h4 class="font-semibold text-notion-text">
                {{ selectedPartido?.equipo_local?.nombre || "Equipo Local" }}
              </h4>
            </div>

            <div class="mx-4 text-center">
              <span class="text-3xl font-bold text-notion-muted">VS</span>
              <div
                :class="[
                  'text-xs mt-1 px-2 py-1 rounded-full text-white',
                  getPartidoColor(selectedPartido?.estado),
                ]"
              >
                {{ getPartidoEmoji(selectedPartido?.estado) }}
                {{ getEstadoLabel(selectedPartido?.estado) }}
              </div>
            </div>

            <div class="flex-1 text-center">
              <div
                class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-xl font-bold"
                :style="{
                  backgroundColor:
                    selectedPartido?.equipo_visitante?.color_principal ||
                    '#dc2626',
                }"
              >
                {{
                  selectedPartido?.equipo_visitante?.nombre?.charAt(0) || "V"
                }}
              </div>
              <h4 class="font-semibold text-notion-text">
                {{
                  selectedPartido?.equipo_visitante?.nombre ||
                  "Equipo Visitante"
                }}
              </h4>
            </div>
          </div>

          <!-- Información del partido -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="flex items-center p-3 bg-notion-bg rounded-lg">
              <ClockIcon class="w-5 h-5 text-primary mr-3" />
              <div>
                <p class="text-xs text-notion-muted">Hora</p>
                <p class="font-medium text-notion-text">
                  {{ formatTime(selectedPartido?.fecha) }}
                </p>
              </div>
            </div>
            <div class="flex items-center p-3 bg-notion-bg rounded-lg">
              <MapPinIcon class="w-5 h-5 text-primary mr-3" />
              <div class="flex-1 min-w-0">
                <p class="text-xs text-notion-muted">Lugar</p>
                <p class="font-medium text-notion-text">
                  {{
                    selectedPartido?.lugar ||
                    selectedPartido?.campo_nombre ||
                    "Por confirmar"
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Enlace a Google Maps -->
          <div
            v-if="selectedPartido?.lugar || selectedPartido?.campo_nombre"
            class="mb-6"
          >
            <a
              :href="
                getGoogleMapsUrl(
                  selectedPartido?.lugar || selectedPartido?.campo_nombre,
                )
              "
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary font-medium transition-colors"
            >
              <MapPinIcon class="w-5 h-5" />
              <span>Abrir en Google Maps</span>
              <ArrowTopRightOnSquareIcon class="w-4 h-4" />
            </a>
          </div>

          <!-- Fecha completa -->
          <div class="mb-6 p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-800">
              📅 {{ formatDate(selectedPartido?.fecha) }}
            </p>
          </div>

          <!-- Convocatoria -->
          <div class="space-y-4">
            <h4 class="font-semibold text-notion-text flex items-center">
              <UsersIcon class="w-5 h-5 mr-2 text-primary" />
              Convocatoria
            </h4>

            <!-- Jugadores principales -->
            <div v-if="partidoConvocatorias.principales.length > 0">
              <p class="text-sm font-medium text-notion-muted mb-2">
                Jugadores Principales
              </p>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="convocatoria in partidoConvocatorias.principales"
                  :key="convocatoria.id"
                  class="flex items-center p-2 bg-green-50 rounded-lg"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mr-2"
                  >
                    {{
                      convocatoria.jugador?.numero_camiseta ||
                      convocatoria.jugador?.nombre?.charAt(0)
                    }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-notion-text truncate">
                      {{ convocatoria.jugador?.nombre }}
                    </p>
                    <p class="text-xs text-notion-muted">
                      {{ getPosicionSpanish(convocatoria.jugador?.posicion) }}
                    </p>
                  </div>
                  <CheckCircleIcon
                    v-if="convocatoria.confirmado"
                    class="w-4 h-4 text-green-500"
                  />
                </div>
              </div>
            </div>

            <!-- Suplentes -->
            <div v-if="partidoConvocatorias.suplentes.length > 0">
              <p class="text-sm font-medium text-notion-muted mb-2">
                Suplentes
              </p>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="convocatoria in partidoConvocatorias.suplentes"
                  :key="convocatoria.id"
                  class="flex items-center p-2 bg-yellow-50 rounded-lg"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold mr-2"
                  >
                    {{
                      convocatoria.jugador?.numero_camiseta ||
                      convocatoria.jugador?.nombre?.charAt(0)
                    }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-notion-text truncate">
                      {{ convocatoria.jugador?.nombre }}
                    </p>
                    <p class="text-xs text-notion-muted">
                      {{ getPosicionSpanish(convocatoria.jugador?.posicion) }}
                    </p>
                  </div>
                  <CheckCircleIcon
                    v-if="convocatoria.confirmado"
                    class="w-4 h-4 text-green-500"
                  />
                </div>
              </div>
            </div>

            <!-- Sin convocatoria -->
            <div
              v-if="
                partidoConvocatorias.principales.length === 0 &&
                partidoConvocatorias.suplentes.length === 0
              "
              class="text-center py-4 text-notion-muted"
            >
              <UsersIcon class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p class="text-sm">No hay convocatoria publicada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
