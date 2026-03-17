<script setup>
import { ref, onMounted, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/vue/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

// ─── Estado partidos existente ────────────────────────────────────────────────
const partidos = ref([]);
const equipos = ref([]);
const loading = ref(true);
const showModal = ref(false);
const showDeleteDialog = ref(false);
const partidoToDelete = ref(null);
const editingPartido = ref(null);
const form = ref({
  equipo_local_id: "",
  equipo_visitante_id: "",
  fecha: "",
  lugar: "Polideportivo Municipal",
  estado: "programado",
});

const estados = ["programado", "jugado", "cancelado"];

const currentMapQuery = ref("");

const updateMap = () => {
  if (form.value.lugar) {
    currentMapQuery.value = form.value.lugar;
  }
};

const selectedMapUrl = computed(() => {
  if (!currentMapQuery.value) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(currentMapQuery.value)}&hl=es&z=15&output=embed`;
});

onMounted(async () => {
  await Promise.all([loadPartidos(), loadEquipos()]);
});

useRouteRefresh(async () => {
  await Promise.all([loadPartidos(), loadEquipos()]);
});

const loadPartidos = async () => {
  try {
    const { data, error } = await supabase
      .from("partidos")
      .select(
        "*, equipo_local:equipos!partidos_equipo_local_id_fkey(nombre), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre)"
      )
      .order("fecha");

    if (error) throw error;
    partidos.value = data || [];
  } catch (e) {
    partidos.value = [
      {
        id: 1,
        fecha: "2024-03-15T18:00:00",
        lugar: "Polideportivo Municipal",
        estado: "programado",
        equipo_local: { nombre: "Los Tigres" },
        equipo_visitante: { nombre: "Águilas FC" },
        goles_local: null,
        goles_visitante: null,
      },
      {
        id: 2,
        fecha: "2024-03-22T18:00:00",
        lugar: "Pabellón San José",
        estado: "programado",
        equipo_local: { nombre: "La Vall United" },
        equipo_visitante: { nombre: "Deportivo Juventud" },
        goles_local: null,
        goles_visitante: null,
      },
    ];
  } finally {
    loading.value = false;
  }
};

const loadEquipos = async () => {
  try {
    const { data, error } = await supabase.from("equipos").select("id, nombre");
    if (error) throw error;
    equipos.value = data || [];
  } catch (e) {
    equipos.value = [
      { id: 1, nombre: "Los Tigres" },
      { id: 2, nombre: "Águilas FC" },
      { id: 3, nombre: "La Vall United" },
      { id: 4, nombre: "Deportivo Juventud" },
    ];
  }
};

const openModal = (partido = null) => {
  if (partido) {
    editingPartido.value = partido;
    let formattedDate = "";
    if (partido.fecha) {
      const dateObj = new Date(partido.fecha);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      formattedDate = new Date(dateObj.getTime() - tzOffset)
        .toISOString()
        .slice(0, 16);
    }
    form.value = {
      equipo_local_id: partido.equipo_local_id,
      equipo_visitante_id: partido.equipo_visitante_id,
      fecha: formattedDate,
      lugar: partido.lugar,
      estado: partido.estado,
    };
    currentMapQuery.value = partido.lugar || "";
  } else {
    editingPartido.value = null;
    form.value = {
      equipo_local_id: "",
      equipo_visitante_id: "",
      fecha: "",
      lugar: "Polideportivo Municipal",
      estado: "programado",
    };
    currentMapQuery.value = "Polideportivo Municipal";
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingPartido.value = null;
};

const savePartido = async () => {
  try {
    const dataToSave = { ...form.value };
    if (dataToSave.fecha) {
      dataToSave.fecha = new Date(dataToSave.fecha).toISOString();
    }
    if (editingPartido.value) {
      await supabase
        .from("partidos")
        .update(dataToSave)
        .eq("id", editingPartido.value.id);
    } else {
      await supabase.from("partidos").insert(dataToSave);
    }
    await loadPartidos();
    closeModal();
  } catch (e) {
    console.error("Error al guardar:", e);
  }
};

const confirmDelete = (partido) => {
  partidoToDelete.value = partido;
  showDeleteDialog.value = true;
};

const deletePartido = async () => {
  if (!partidoToDelete.value) return;
  try {
    const id = partidoToDelete.value.id;
    await supabase.from("partidos").delete().eq("id", id);
    partidos.value = partidos.value.filter((p) => p.id !== id);
  } catch (e) {
    console.error("Error al eliminar:", e);
  } finally {
    showDeleteDialog.value = false;
    partidoToDelete.value = null;
  }
};

const formatDate = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEstadoClass = (estado) => {
  switch (estado) {
    case "programado":
      return "badge-primary";
    case "jugado":
      return "badge-success";
    case "cancelado":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
};

// ─── Nueva Temporada ─────────────────────────────────────────────────────────
const showTemporadaModal = ref(false);
const temporadaStep = ref(1);
const creatingTemporada = ref(false);
const temporadaError = ref("");
const temporadaSuccess = ref("");

const defaultTemporadaForm = () => ({
  nombre: `Temporada ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  año_inicio: new Date().getFullYear(),
  año_fin: new Date().getFullYear() + 1,
  fecha_inicio: "",
  semanas_entre_jornadas: 1,
  hora_inicio: "17:00",
  hora_fin: "20:00",
  duracion_partido: 60,
  lugar: "Polideportivo Municipal",
  equipos_seleccionados: [],
});

const temporadaForm = ref(defaultTemporadaForm());

const openTemporadaModal = () => {
  temporadaError.value = "";
  temporadaSuccess.value = "";
  temporadaStep.value = 1;
  temporadaForm.value = defaultTemporadaForm();
  temporadaForm.value.equipos_seleccionados = equipos.value.map((e) => e.id);
  showTemporadaModal.value = true;
};

const closeTemporadaModal = () => {
  showTemporadaModal.value = false;
};

const toggleEquipo = (equipoId) => {
  const idx = temporadaForm.value.equipos_seleccionados.indexOf(equipoId);
  if (idx === -1) {
    temporadaForm.value.equipos_seleccionados.push(equipoId);
  } else {
    temporadaForm.value.equipos_seleccionados.splice(idx, 1);
  }
};

// Convierte "HH:MM" a minutos desde medianoche
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Convierte minutos a "HH:MM"
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// Calcula los slots de hora disponibles en un día de jornada
const timeSlots = computed(() => {
  const { hora_inicio, hora_fin, duracion_partido } = temporadaForm.value;
  if (!hora_inicio || !hora_fin || !duracion_partido) return [];
  const slots = [];
  let current = timeToMinutes(hora_inicio);
  const end = timeToMinutes(hora_fin);
  const dur = parseInt(duracion_partido);
  while (current <= end) {
    slots.push(minutesToTime(current));
    current += dur;
  }
  return slots;
});

// Algoritmo round-robin por el método del círculo
// Devuelve array de jornadas, cada una con array de {home, away}
const generateRoundRobin = (teamIds) => {
  const teams = [...teamIds];
  // Si número impar, añadir "bye" (null)
  if (teams.length % 2 !== 0) teams.push(null);

  const n = teams.length;
  const totalRounds = n - 1;
  const fixed = teams[0];
  const rotating = teams.slice(1);

  const schedule = [];

  for (let r = 0; r < totalRounds; r++) {
    const round = [];
    const list = [fixed, ...rotating];

    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a !== null && b !== null) {
        // Alternar local/visitante en rondas pares/impares para equilibrar ventaja de campo
        round.push(
          r % 2 === 0
            ? { home: a, away: b }
            : { home: b, away: a }
        );
      }
    }

    schedule.push(round);

    // Rotar: el último pasa al principio (posición 1)
    rotating.unshift(rotating.pop());
  }

  return schedule;
};

// Genera la vista previa completa del calendario
const previewSchedule = computed(() => {
  const {
    equipos_seleccionados,
    fecha_inicio,
    semanas_entre_jornadas,
  } = temporadaForm.value;

  if (!equipos_seleccionados.length || !fecha_inicio) return [];

  const slots = timeSlots.value;
  if (!slots.length) return [];

  const rounds = generateRoundRobin(equipos_seleccionados);
  const equipoMap = Object.fromEntries(
    equipos.value.map((e) => [e.id, e.nombre])
  );

  return rounds.map((matches, roundIndex) => {
    // Fecha de esta jornada
    const roundDate = new Date(fecha_inicio + "T12:00:00");
    roundDate.setDate(
      roundDate.getDate() + roundIndex * parseInt(semanas_entre_jornadas) * 7
    );

    // Rotar slots: jornada N empieza en slot N % total
    const offset = roundIndex % slots.length;
    const rotatedSlots = [
      ...slots.slice(offset),
      ...slots.slice(0, offset),
    ];

    const partidosJornada = matches.map((match, matchIndex) => {
      const slot = rotatedSlots[matchIndex % rotatedSlots.length];
      const [h, m] = slot.split(":").map(Number);
      const matchDate = new Date(roundDate);
      matchDate.setHours(h, m, 0, 0);

      return {
        equipo_local_id: match.home,
        equipo_visitante_id: match.away,
        local_nombre: equipoMap[match.home] || "—",
        visitante_nombre: equipoMap[match.away] || "—",
        hora: slot,
        fecha: matchDate,
      };
    });

    return {
      numero: roundIndex + 1,
      nombre: `Jornada ${roundIndex + 1}`,
      fecha: new Date(roundDate),
      partidos: partidosJornada,
    };
  });
});

// Validaciones por paso
const canGoToStep2 = computed(() => {
  const f = temporadaForm.value;
  return (
    f.nombre.trim() &&
    f.año_inicio &&
    f.año_fin &&
    f.equipos_seleccionados.length >= 2
  );
});

const canGoToStep3 = computed(() => {
  const f = temporadaForm.value;
  return (
    f.fecha_inicio &&
    f.hora_inicio &&
    f.hora_fin &&
    f.duracion_partido > 0 &&
    f.semanas_entre_jornadas > 0 &&
    f.lugar.trim() &&
    timeSlots.value.length > 0 &&
    timeToMinutes(f.hora_inicio) < timeToMinutes(f.hora_fin)
  );
});

const nextStep = () => {
  if (temporadaStep.value === 1 && canGoToStep2.value)
    temporadaStep.value = 2;
  else if (temporadaStep.value === 2 && canGoToStep3.value)
    temporadaStep.value = 3;
};

const prevStep = () => {
  if (temporadaStep.value > 1) temporadaStep.value--;
};

const formatPreviewDate = (date) => {
  return new Date(date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Insertar temporada, jornadas y partidos en Supabase
const crearTemporada = async () => {
  creatingTemporada.value = true;
  temporadaError.value = "";

  try {
    const { nombre, año_inicio, año_fin, lugar } = temporadaForm.value;
    const preview = previewSchedule.value;

    if (!preview.length) throw new Error("No hay jornadas para crear.");

    const fechaInicio = preview[0].fecha.toISOString().split("T")[0];
    const fechaFin = preview[preview.length - 1].fecha
      .toISOString()
      .split("T")[0];

    // 1. Crear temporada
    const { data: temporadaData, error: temporadaErr } = await supabase
      .from("temporadas")
      .insert({
        nombre,
        año_inicio: parseInt(año_inicio),
        año_fin: parseInt(año_fin),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        activa: false,
      })
      .select()
      .single();

    if (temporadaErr) throw temporadaErr;

    // 2. Crear jornadas y sus partidos
    for (const jornada of preview) {
      const { data: jornadaData, error: jornadaErr } = await supabase
        .from("jornadas")
        .insert({
          temporada_id: temporadaData.id,
          numero: jornada.numero,
          nombre: jornada.nombre,
          fecha_inicio: jornada.fecha.toISOString().split("T")[0],
          fecha_fin: jornada.fecha.toISOString().split("T")[0],
        })
        .select()
        .single();

      if (jornadaErr) throw jornadaErr;

      const partidosToInsert = jornada.partidos.map((p) => ({
        jornada_id: jornadaData.id,
        equipo_local_id: p.equipo_local_id,
        equipo_visitante_id: p.equipo_visitante_id,
        fecha: p.fecha.toISOString(),
        lugar,
        estado: "programado",
      }));

      const { error: partidosErr } = await supabase
        .from("partidos")
        .insert(partidosToInsert);

      if (partidosErr) throw partidosErr;
    }

    temporadaSuccess.value = `¡Temporada "${nombre}" creada con ${preview.length} jornadas y ${preview.reduce((acc, j) => acc + j.partidos.length, 0)} partidos!`;
    await loadPartidos();

    setTimeout(() => {
      showTemporadaModal.value = false;
      temporadaSuccess.value = "";
    }, 2500);
  } catch (e) {
    console.error("Error al crear temporada:", e);
    temporadaError.value = e.message || "Error desconocido al crear la temporada.";
  } finally {
    creatingTemporada.value = false;
  }
};
</script>

<template>
  <div class="page-container">
    <!-- Cabecera -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="page-title">Gestionar Partidos</h1>
        <p class="page-subtitle">
          Programa y gestiona los partidos de la organización
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <!-- Botón Nueva Temporada -->
        <button
          @click="openTemporadaModal"
          class="btn-outline flex items-center space-x-2 border-primary text-primary hover:bg-primary hover:text-white"
        >
          <CalendarDaysIcon class="w-5 h-5" />
          <span>Nueva Temporada</span>
        </button>
        <!-- Botón Nuevo Partido -->
        <button
          @click="openModal()"
          class="btn-primary flex items-center space-x-2"
        >
          <PlusIcon class="w-5 h-5" />
          <span>Nuevo Partido</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Tabla de partidos -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-notion-bg">
            <tr>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">Fecha</th>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">Partido</th>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">Lugar</th>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">Estado</th>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">Resultado</th>
              <th class="text-right py-4 px-6 text-sm font-medium text-notion-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="partido in partidos"
              :key="partido.id"
              class="border-t border-notion-border hover:bg-notion-bg transition-colors"
            >
              <td class="py-4 px-6 text-sm text-notion-muted">
                {{ formatDate(partido.fecha) }}
              </td>
              <td class="py-4 px-6">
                <span class="font-medium text-notion-text">{{ partido.equipo_local?.nombre }}</span>
                <span class="text-notion-muted mx-2">vs</span>
                <span class="font-medium text-notion-text">{{ partido.equipo_visitante?.nombre }}</span>
              </td>
              <td class="py-4 px-6 text-sm text-notion-muted">{{ partido.lugar }}</td>
              <td class="py-4 px-6">
                <span :class="['badge', getEstadoClass(partido.estado)]">{{ partido.estado }}</span>
              </td>
              <td class="py-4 px-6 text-sm font-medium text-notion-text">
                <span v-if="partido.goles_local !== null">
                  {{ partido.goles_local }} - {{ partido.goles_visitante }}
                </span>
                <span v-else class="text-notion-muted">-</span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="openModal(partido)"
                    class="p-2 text-notion-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(partido)"
                    class="p-2 text-notion-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Modal Nuevo Partido ─────────────────────────────────────────────── -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-6">
        <h2 class="text-xl font-semibold text-notion-text mb-6">
          {{ editingPartido ? "Editar Partido" : "Nuevo Partido" }}
        </h2>

        <form @submit.prevent="savePartido" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">Equipo Local</label>
            <select v-model="form.equipo_local_id" required class="input">
              <option value="">Seleccionar equipo</option>
              <option v-for="equipo in equipos" :key="equipo.id" :value="equipo.id">
                {{ equipo.nombre }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">Equipo Visitante</label>
            <select v-model="form.equipo_visitante_id" required class="input">
              <option value="">Seleccionar equipo</option>
              <option v-for="equipo in equipos" :key="equipo.id" :value="equipo.id">
                {{ equipo.nombre }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">Fecha y Hora</label>
            <input v-model="form.fecha" type="datetime-local" required class="input" />
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">Ubicación (Lugar)</label>
            <div class="flex space-x-2 mb-2">
              <input
                v-model="form.lugar"
                type="text"
                required
                class="input flex-1"
                placeholder="Buscar en mapa (ej: Polideportivo Madrid)"
                @keydown.enter.prevent="updateMap"
              />
              <button type="button" @click="updateMap" class="btn-primary whitespace-nowrap">
                Buscar
              </button>
            </div>
            <div v-if="selectedMapUrl" class="w-full h-48 rounded-lg overflow-hidden border border-notion-border mt-2">
              <iframe
                width="100%"
                height="100%"
                frameborder="0"
                scrolling="no"
                marginheight="0"
                marginwidth="0"
                :src="selectedMapUrl"
              ></iframe>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">Estado</label>
            <select v-model="form.estado" class="input">
              <option v-for="estado in estados" :key="estado" :value="estado">{{ estado }}</option>
            </select>
          </div>

          <div class="flex space-x-3 pt-4">
            <button type="button" @click="closeModal" class="btn-outline flex-1">Cancelar</button>
            <button type="submit" class="btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Modal Nueva Temporada ──────────────────────────────────────────── -->
    <div
      v-if="showTemporadaModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        <!-- Cabecera del modal -->
        <div class="px-6 pt-6 pb-4 border-b border-notion-border flex-shrink-0">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <CalendarDaysIcon class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 class="text-xl font-semibold text-notion-text">Nueva Temporada</h2>
                <p class="text-sm text-notion-muted">Generador automático de calendario</p>
              </div>
            </div>
            <button @click="closeTemporadaModal" class="text-notion-muted hover:text-notion-text p-1">
              ✕
            </button>
          </div>

          <!-- Indicador de pasos -->
          <div class="flex items-center space-x-2">
            <div
              v-for="step in [1, 2, 3]"
              :key="step"
              class="flex items-center"
            >
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  temporadaStep === step
                    ? 'bg-primary text-white'
                    : temporadaStep > step
                    ? 'bg-green-500 text-white'
                    : 'bg-notion-bg text-notion-muted border border-notion-border',
                ]"
              >
                <span v-if="temporadaStep > step">✓</span>
                <span v-else>{{ step }}</span>
              </div>
              <div
                v-if="step < 3"
                :class="[
                  'w-12 h-0.5 mx-1',
                  temporadaStep > step ? 'bg-green-500' : 'bg-notion-border',
                ]"
              ></div>
            </div>
            <div class="ml-3 text-sm text-notion-muted">
              <span v-if="temporadaStep === 1">Configurar temporada</span>
              <span v-else-if="temporadaStep === 2">Configurar horarios</span>
              <span v-else>Previsualizar y confirmar</span>
            </div>
          </div>
        </div>

        <!-- Cuerpo scrollable -->
        <div class="flex-1 overflow-y-auto px-6 py-5">

          <!-- ── Paso 1: Datos de temporada + equipos ── -->
          <div v-if="temporadaStep === 1" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">Nombre de la temporada</label>
              <input
                v-model="temporadaForm.nombre"
                type="text"
                class="input"
                placeholder="Ej: Temporada 2025-2026"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">Año de inicio</label>
                <input v-model="temporadaForm.año_inicio" type="number" class="input" min="2020" max="2099" />
              </div>
              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">Año de fin</label>
                <input v-model="temporadaForm.año_fin" type="number" class="input" min="2020" max="2099" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">
                Equipos participantes
                <span class="text-notion-muted font-normal">(mín. 2)</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="equipo in equipos"
                  :key="equipo.id"
                  type="button"
                  @click="toggleEquipo(equipo.id)"
                  :class="[
                    'flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-all',
                    temporadaForm.equipos_seleccionados.includes(equipo.id)
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'border-notion-border text-notion-muted hover:border-primary/50',
                  ]"
                >
                  <span
                    :class="[
                      'w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0',
                      temporadaForm.equipos_seleccionados.includes(equipo.id)
                        ? 'bg-primary border-primary text-white'
                        : 'border-notion-border',
                    ]"
                  >
                    <span v-if="temporadaForm.equipos_seleccionados.includes(equipo.id)">✓</span>
                  </span>
                  <span class="truncate">{{ equipo.nombre }}</span>
                </button>
              </div>
              <p class="text-xs text-notion-muted mt-2">
                {{ temporadaForm.equipos_seleccionados.length }} equipos seleccionados →
                {{ temporadaForm.equipos_seleccionados.length >= 2
                    ? (temporadaForm.equipos_seleccionados.length % 2 === 0
                        ? temporadaForm.equipos_seleccionados.length - 1
                        : temporadaForm.equipos_seleccionados.length)
                    : 0 }} jornadas,
                {{ temporadaForm.equipos_seleccionados.length >= 2
                    ? Math.floor(temporadaForm.equipos_seleccionados.length / 2)
                    : 0 }} partidos por jornada
              </p>
            </div>
          </div>

          <!-- ── Paso 2: Configuración de horarios ── -->
          <div v-else-if="temporadaStep === 2" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">Fecha de la primera jornada</label>
              <input v-model="temporadaForm.fecha_inicio" type="date" class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">Semanas entre jornadas</label>
              <input
                v-model="temporadaForm.semanas_entre_jornadas"
                type="number"
                class="input"
                min="1"
                max="4"
              />
              <p class="text-xs text-notion-muted mt-1">Cada cuántas semanas se juega una jornada</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">Hora de inicio</label>
                <input v-model="temporadaForm.hora_inicio" type="time" class="input" />
                <p class="text-xs text-notion-muted mt-1">Primer partido del día</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">Hora límite</label>
                <input v-model="temporadaForm.hora_fin" type="time" class="input" />
                <p class="text-xs text-notion-muted mt-1">Último inicio posible</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">Duración de cada partido (minutos)</label>
              <input
                v-model="temporadaForm.duracion_partido"
                type="number"
                class="input"
                min="30"
                max="120"
                step="15"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">Lugar de los partidos</label>
              <input
                v-model="temporadaForm.lugar"
                type="text"
                class="input"
                placeholder="Polideportivo Municipal"
              />
            </div>

            <!-- Vista previa de slots -->
            <div v-if="timeSlots.length" class="bg-notion-bg rounded-lg p-4">
              <p class="text-sm font-medium text-notion-text mb-2">
                Horarios generados ({{ timeSlots.length }} franjas)
              </p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(slot, i) in timeSlots"
                  :key="slot"
                  class="px-3 py-1 bg-white border border-notion-border rounded-full text-sm text-notion-text"
                >
                  {{ slot }}
                </span>
              </div>
              <p class="text-xs text-notion-muted mt-2">
                Las franjas rotan cada jornada para que los equipos no jueguen siempre a la misma hora
              </p>
            </div>
            <div v-else class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              Ajusta los horarios: la hora de inicio debe ser anterior a la hora límite
            </div>
          </div>

          <!-- ── Paso 3: Vista previa ── -->
          <div v-else-if="temporadaStep === 3">
            <!-- Resumen -->
            <div class="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-5">
              <h3 class="font-semibold text-primary mb-1">{{ temporadaForm.nombre }}</h3>
              <div class="grid grid-cols-3 gap-3 text-sm mt-3">
                <div class="text-center">
                  <p class="text-2xl font-bold text-notion-text">{{ previewSchedule.length }}</p>
                  <p class="text-notion-muted">Jornadas</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-bold text-notion-text">
                    {{ previewSchedule.reduce((acc, j) => acc + j.partidos.length, 0) }}
                  </p>
                  <p class="text-notion-muted">Partidos</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-bold text-notion-text">{{ temporadaForm.equipos_seleccionados.length }}</p>
                  <p class="text-notion-muted">Equipos</p>
                </div>
              </div>
            </div>

            <!-- Lista de jornadas -->
            <div class="space-y-4">
              <div
                v-for="jornada in previewSchedule"
                :key="jornada.numero"
                class="border border-notion-border rounded-lg overflow-hidden"
              >
                <div class="bg-notion-bg px-4 py-2 flex items-center justify-between">
                  <span class="font-medium text-notion-text text-sm">{{ jornada.nombre }}</span>
                  <span class="text-xs text-notion-muted">{{ formatPreviewDate(jornada.fecha) }}</span>
                </div>
                <div class="divide-y divide-notion-border">
                  <div
                    v-for="(partido, i) in jornada.partidos"
                    :key="i"
                    class="px-4 py-2.5 flex items-center justify-between text-sm"
                  >
                    <div class="flex items-center space-x-2 flex-1 min-w-0">
                      <span class="font-medium text-notion-text truncate">{{ partido.local_nombre }}</span>
                      <span class="text-notion-muted flex-shrink-0">vs</span>
                      <span class="font-medium text-notion-text truncate">{{ partido.visitante_nombre }}</span>
                    </div>
                    <span class="ml-4 flex-shrink-0 text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {{ partido.hora }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mensaje de éxito -->
            <div
              v-if="temporadaSuccess"
              class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700"
            >
              {{ temporadaSuccess }}
            </div>

            <!-- Mensaje de error -->
            <div
              v-if="temporadaError"
              class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600"
            >
              {{ temporadaError }}
            </div>
          </div>
        </div>

        <!-- Pie del modal con navegación -->
        <div class="px-6 py-4 border-t border-notion-border flex-shrink-0 flex items-center justify-between">
          <button
            v-if="temporadaStep > 1"
            @click="prevStep"
            class="btn-outline flex items-center space-x-1"
            :disabled="creatingTemporada"
          >
            <ChevronLeftIcon class="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <button
            v-else
            @click="closeTemporadaModal"
            class="btn-outline"
          >
            Cancelar
          </button>

          <!-- Paso 1 → 2 -->
          <button
            v-if="temporadaStep === 1"
            @click="nextStep"
            :disabled="!canGoToStep2"
            class="btn-primary flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Siguiente</span>
            <ChevronRightIcon class="w-4 h-4" />
          </button>

          <!-- Paso 2 → 3 -->
          <button
            v-else-if="temporadaStep === 2"
            @click="nextStep"
            :disabled="!canGoToStep3"
            class="btn-primary flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Vista previa</span>
            <ChevronRightIcon class="w-4 h-4" />
          </button>

          <!-- Paso 3: Crear -->
          <button
            v-else-if="temporadaStep === 3"
            @click="crearTemporada"
            :disabled="creatingTemporada || !!temporadaSuccess"
            class="btn-primary flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span v-if="creatingTemporada" class="animate-spin">⏳</span>
            <CalendarDaysIcon v-else class="w-4 h-4" />
            <span>{{ creatingTemporada ? "Creando..." : "Crear temporada" }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      title="Eliminar Partido"
      message="¿Estás seguro de que deseas eliminar este partido? Esta acción no se puede deshacer."
      confirmText="Eliminar"
      cancelText="Cancelar"
      type="danger"
      @confirm="deletePartido"
      @cancel="showDeleteDialog = false"
      @close="showDeleteDialog = false"
    />
  </div>
</template>
