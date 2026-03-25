<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { supabase } from "@/lib/supabase";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "resultado-saved"]);

const saving = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);
const imageErrors = ref({});

const form = ref({
  equipo_local_id: "",
  equipo_visitante_id: "",
  goles_local: 0,
  goles_visitante: 0,
  fecha: new Date().toISOString().slice(0, 10),
  hora_inicio: "",
  hora_fin: "",
  lugar: "Polideportivo Municipal",
  arbitro: "",
  observaciones: "",
  redactado_por: "",
  confirmado: false,
});

// Data
const equipos = ref([]);
const scheduledMatches = ref([]);
const selectedScheduledMatch = ref(null);
const jugadoresLocal = ref([]);
const jugadoresVisitante = ref([]);
const statsLocal = ref([]);
const statsVisitante = ref([]);
const golesDetalleLocal = ref([]);
const golesDetalleVisitante = ref([]);
const currentMapQuery = ref("Polideportivo Municipal");

// Computed properties
const equiposVisitante = computed(() =>
  equipos.value.filter((e) => e.id !== form.value.equipo_local_id)
);

const equipoLocalSeleccionado = computed(() =>
  equipos.value.find((e) => e.id === form.value.equipo_local_id)
);

const equipoVisitanteSeleccionado = computed(() =>
  equipos.value.find((e) => e.id === form.value.equipo_visitante_id)
);

const selectedMapUrl = computed(() => {
  if (!currentMapQuery.value) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(currentMapQuery.value)}&hl=es&z=15&output=embed`;
});

// Watchers
watch(
  () => selectedScheduledMatch.value,
  (selectedId) => {
    if (selectedId) {
      const match = scheduledMatches.value.find((m) => m.id === selectedId);
      if (match) {
        form.value.equipo_local_id = match.equipo_local_id;
        form.value.equipo_visitante_id = match.equipo_visitante_id;
        form.value.fecha = new Date(match.fecha).toISOString().slice(0, 10);
        form.value.lugar = match.lugar;
      }
    }
  }
);

watch(
  () => form.value.equipo_local_id,
  async (newId) => {
    jugadoresLocal.value = await fetchJugadoresByEquipo(newId);
    statsLocal.value = jugadoresLocal.value.map((j) => ({
      jugador_id: j.id,
      goles: 0,
      asistencias: 0,
      tarjetas_amarillas: 0,
      tarjetas_rojas: 0,
    }));
    golesDetalleLocal.value = Array.from(
      { length: Math.max(0, Number(form.value.goles_local) || 0) },
      () => ({ jugador_id: "", asistente_id: "" })
    );
  }
);

watch(
  () => form.value.equipo_visitante_id,
  async (newId) => {
    jugadoresVisitante.value = await fetchJugadoresByEquipo(newId);
    statsVisitante.value = jugadoresVisitante.value.map((j) => ({
      jugador_id: j.id,
      goles: 0,
      asistencias: 0,
      tarjetas_amarillas: 0,
      tarjetas_rojas: 0,
    }));
    golesDetalleVisitante.value = Array.from(
      { length: Math.max(0, Number(form.value.goles_visitante) || 0) },
      () => ({ jugador_id: "", asistente_id: "" })
    );
  }
);

watch(
  () => form.value.goles_local,
  (newCount) => {
    const count = Math.max(0, Number(newCount) || 0);
    const arr = golesDetalleLocal.value;
    if (count > arr.length) {
      for (let i = arr.length; i < count; i++)
        arr.push({ jugador_id: "", asistente_id: "" });
    } else {
      golesDetalleLocal.value = arr.slice(0, count);
    }
  }
);

watch(
  () => form.value.goles_visitante,
  (newCount) => {
    const count = Math.max(0, Number(newCount) || 0);
    const arr = golesDetalleVisitante.value;
    if (count > arr.length) {
      for (let i = arr.length; i < count; i++)
        arr.push({ jugador_id: "", asistente_id: "" });
    } else {
      golesDetalleVisitante.value = arr.slice(0, count);
    }
  }
);

// Cuando se abre el panel, cargar datos
watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      await initializePanel();
    }
  }
);

// Methods
const initializePanel = async () => {
  saveError.value = "";
  saveSuccess.value = false;
  form.value = {
    equipo_local_id: "",
    equipo_visitante_id: "",
    goles_local: 0,
    goles_visitante: 0,
    fecha: new Date().toISOString().slice(0, 10),
    hora_inicio: "",
    hora_fin: "",
    lugar: "Polideportivo Municipal",
    arbitro: "",
    observaciones: "",
    redactado_por: "",
    confirmado: false,
  };
  selectedScheduledMatch.value = null;
  statsLocal.value = [];
  statsVisitante.value = [];
  golesDetalleLocal.value = [];
  golesDetalleVisitante.value = [];
  currentMapQuery.value = "Polideportivo Municipal";

  if (equipos.value.length === 0) await fetchEquipos();
  await fetchScheduledMatches();
};

const fetchEquipos = async () => {
  const { data } = await supabase
    .from("equipos")
    .select("id, nombre, color_principal, escudo_url, logo_url")
    .order("nombre");
  equipos.value = data || [];
};

const fetchJugadoresByEquipo = async (equipoId) => {
  if (!equipoId) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre, numero_camiseta, posicion")
    .eq("equipo_id", equipoId)
    .eq("rol", "jugador")
    .order("nombre");
  return data || [];
};

const fetchScheduledMatches = async () => {
  const { data } = await supabase
    .from("partidos")
    .select(
      "id, fecha, lugar, equipo_local_id, equipo_visitante_id, equipo_local:equipos!partidos_equipo_local_id_fkey(nombre), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre)"
    )
    .eq("estado", "programado")
    .order("fecha");
  scheduledMatches.value = data || [];
};

const getEquipoLogo = (equipo) => equipo?.logo_url || equipo?.escudo_url || null;

const hasEquipoLogo = (equipo) =>
  Boolean(getEquipoLogo(equipo)) && !imageErrors.value[equipo?.id];

const handleImageError = (equipoId) => {
  imageErrors.value = {
    ...imageErrors.value,
    [equipoId]: true,
  };
};

const updateMap = () => {
  if (form.value.lugar) {
    currentMapQuery.value = form.value.lugar;
  }
};

const handleSave = async () => {
  saveError.value = "";
  saveSuccess.value = false;

  if (!form.value.equipo_local_id || !form.value.equipo_visitante_id) {
    saveError.value = "Selecciona ambos equipos.";
    return;
  }
  if (form.value.equipo_local_id === form.value.equipo_visitante_id) {
    saveError.value = "Los equipos local y visitante no pueden ser el mismo.";
    return;
  }
  if (!form.value.fecha) {
    saveError.value = "Indica la fecha del partido.";
    return;
  }
  if (!form.value.confirmado) {
    saveError.value = "Debes confirmar que la información es correcta.";
    return;
  }

  saving.value = true;
  try {
    const partidoData = {
      equipo_local_id: form.value.equipo_local_id,
      equipo_visitante_id: form.value.equipo_visitante_id,
      goles_local: Number(form.value.goles_local),
      goles_visitante: Number(form.value.goles_visitante),
      fecha: new Date(form.value.fecha).toISOString(),
      lugar: form.value.lugar || "Polideportivo Municipal",
      estado: "jugado",
      hora_inicio: form.value.hora_inicio || null,
      hora_fin: form.value.hora_fin || null,
      arbitro: form.value.arbitro || null,
      observaciones: form.value.observaciones || null,
      redactado_por: form.value.redactado_por || null,
      confirmado: form.value.confirmado,
    };

    let partidoId;
    if (selectedScheduledMatch.value) {
      // Update existing scheduled match
      const { error: updateError } = await supabase
        .from("partidos")
        .update(partidoData)
        .eq("id", selectedScheduledMatch.value);
      if (updateError) throw updateError;
      partidoId = selectedScheduledMatch.value;
    } else {
      // Insert new match
      const { data, error: insertError } = await supabase
        .from("partidos")
        .insert(partidoData)
        .select("id")
        .single();
      if (insertError) throw insertError;
      partidoId = data.id;
    }

    // Build stats map merging goal details + card stats
    const statsMap = {};
    const addStat = (jugadorId, field, amount = 1) => {
      if (!jugadorId) return;
      if (!statsMap[jugadorId]) {
        statsMap[jugadorId] = {
          partido_id: partidoId,
          jugador_id: jugadorId,
          goles: 0,
          asistencias: 0,
          tarjetas_amarillas: 0,
          tarjetas_rojas: 0,
        };
      }
      statsMap[jugadorId][field] += amount;
    };

    // Goles y asistencias desde el detalle de goles
    [...golesDetalleLocal.value, ...golesDetalleVisitante.value].forEach((gol) => {
      addStat(gol.jugador_id, "goles");
      addStat(gol.asistente_id, "asistencias");
    });

    // Tarjetas desde la sección de estadísticas
    [...statsLocal.value, ...statsVisitante.value].forEach((s) => {
      if (!s.jugador_id) return;
      if (s.tarjetas_amarillas) addStat(s.jugador_id, "tarjetas_amarillas", s.tarjetas_amarillas);
      if (s.tarjetas_rojas) addStat(s.jugador_id, "tarjetas_rojas", s.tarjetas_rojas);
    });

    const allStats = Object.values(statsMap).filter(
      (s) => s.goles || s.asistencias || s.tarjetas_amarillas || s.tarjetas_rojas
    );

    if (allStats.length > 0) {
      const { error: statsError } = await supabase
        .from("estadisticas_partido_jugador")
        .insert(allStats);
      if (statsError) throw statsError;
    }

    saveSuccess.value = true;
    emit("resultado-saved");

    setTimeout(() => {
      saveSuccess.value = false;
      emit("close");
    }, 1800);
  } catch (e) {
    console.error("Error guardando resultado:", e);
    saveError.value = "No se pudo guardar el resultado. Inténtalo de nuevo.";
  } finally {
    saving.value = false;
  }
};

const closePanel = () => {
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        @click="closePanel"
      />
    </Transition>

    <!-- Slide-over panel -->
    <Transition name="slideover">
      <div
        v-if="show"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-notion-border bg-white px-4 py-3 sm:px-6">
          <h2 class="text-lg font-semibold text-notion-text">Registrar resultado</h2>
          <button
            type="button"
            class="text-notion-muted hover:text-notion-text transition-colors"
            @click="closePanel"
          >
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content (scrollable) -->
        <div class="flex-1 overflow-y-auto">
          <form class="space-y-6 px-4 py-6 sm:px-6">
            <!-- Partido programado -->
            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">
                Seleccionar partido programado (opcional)
              </label>
              <select
                v-model="selectedScheduledMatch"
                class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Ninguno --</option>
                <option
                  v-for="match in scheduledMatches"
                  :key="match.id"
                  :value="match.id"
                >
                  {{ match.equipo_local?.nombre }} vs
                  {{ match.equipo_visitante?.nombre }} ({{
                    new Date(match.fecha).toLocaleDateString("es-ES")
                  }})
                </option>
              </select>
            </div>

            <!-- Equipos -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">
                  Equipo local <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.equipo_local_id"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Selecciona un equipo --</option>
                  <option
                    v-for="equipo in equipos"
                    :key="equipo.id"
                    :value="equipo.id"
                  >
                    {{ equipo.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">
                  Equipo visitante <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.equipo_visitante_id"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Selecciona un equipo --</option>
                  <option
                    v-for="equipo in equiposVisitante"
                    :key="equipo.id"
                    :value="equipo.id"
                  >
                    {{ equipo.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Marcador -->
            <div class="rounded-lg bg-notion-bg/50 p-4">
              <p class="text-xs font-medium text-notion-muted mb-3 uppercase">Marcador</p>
              <div class="flex items-center justify-between gap-3">
                <!-- Equipo local marcador -->
                <div class="flex-1 text-center">
                  <img
                    v-if="hasEquipoLogo(equipoLocalSeleccionado)"
                    :src="getEquipoLogo(equipoLocalSeleccionado)"
                    :alt="`Escudo de ${equipoLocalSeleccionado?.nombre || 'Local'}`"
                    class="mx-auto mb-1.5 w-10 h-10 rounded-full object-cover border border-notion-border bg-white"
                    @error="() => handleImageError(equipoLocalSeleccionado?.id)"
                  />
                  <p class="text-xs text-notion-muted">
                    {{ equipoLocalSeleccionado?.nombre || "Local" }}
                  </p>
                </div>

                <div class="flex gap-2">
                  <input
                    v-model.number="form.goles_local"
                    type="number"
                    min="0"
                    class="w-14 rounded-lg border border-notion-border bg-white px-2 py-2 text-center text-lg font-bold text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span class="flex items-center text-notion-muted">–</span>
                  <input
                    v-model.number="form.goles_visitante"
                    type="number"
                    min="0"
                    class="w-14 rounded-lg border border-notion-border bg-white px-2 py-2 text-center text-lg font-bold text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <!-- Equipo visitante marcador -->
                <div class="flex-1 text-center">
                  <img
                    v-if="hasEquipoLogo(equipoVisitanteSeleccionado)"
                    :src="getEquipoLogo(equipoVisitanteSeleccionado)"
                    :alt="`Escudo de ${equipoVisitanteSeleccionado?.nombre || 'Visitante'}`"
                    class="mx-auto mb-1.5 w-10 h-10 rounded-full object-cover border border-notion-border bg-white"
                    @error="() => handleImageError(equipoVisitanteSeleccionado?.id)"
                  />
                  <p class="text-xs text-notion-muted">
                    {{ equipoVisitanteSeleccionado?.nombre || "Visitante" }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Detalle de goles -->
            <div
              v-if="(form.goles_local > 0 && equipoLocalSeleccionado) || (form.goles_visitante > 0 && equipoVisitanteSeleccionado)"
              class="space-y-4"
            >
              <p class="text-xs font-medium text-notion-muted uppercase tracking-wide">
                Detalle de goles
              </p>

              <!-- Goles equipo local -->
              <div v-if="form.goles_local > 0 && equipoLocalSeleccionado">
                <p class="text-sm font-medium text-notion-text mb-2 flex items-center gap-1.5">
                  <img
                    v-if="hasEquipoLogo(equipoLocalSeleccionado)"
                    :src="getEquipoLogo(equipoLocalSeleccionado)"
                    class="w-4 h-4 rounded-full object-cover"
                    @error="() => handleImageError(equipoLocalSeleccionado.id)"
                  />
                  {{ equipoLocalSeleccionado.nombre }}
                  <span class="text-notion-muted font-normal">({{ form.goles_local }} {{ form.goles_local === 1 ? 'gol' : 'goles' }})</span>
                </p>
                <div class="space-y-2">
                  <div
                    v-for="(gol, idx) in golesDetalleLocal"
                    :key="idx"
                    class="flex items-center gap-2 rounded-lg bg-notion-bg/50 border border-notion-border p-2.5"
                  >
                    <span class="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {{ idx + 1 }}
                    </span>
                    <div class="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs text-notion-muted mb-1">Goleador</label>
                        <select
                          v-model="gol.jugador_id"
                          class="w-full rounded border border-notion-border px-2 py-1.5 text-xs text-notion-text bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">— Desconocido —</option>
                          <option
                            v-for="j in jugadoresLocal"
                            :key="j.id"
                            :value="j.id"
                          >
                            {{ j.nombre }}{{ j.numero_camiseta ? ` #${j.numero_camiseta}` : '' }}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs text-notion-muted mb-1">Asistencia</label>
                        <select
                          v-model="gol.asistente_id"
                          class="w-full rounded border border-notion-border px-2 py-1.5 text-xs text-notion-text bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">— Sin asistencia —</option>
                          <option
                            v-for="j in jugadoresLocal"
                            :key="j.id"
                            :value="j.id"
                            :disabled="j.id === gol.jugador_id"
                          >
                            {{ j.nombre }}{{ j.numero_camiseta ? ` #${j.numero_camiseta}` : '' }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Goles equipo visitante -->
              <div v-if="form.goles_visitante > 0 && equipoVisitanteSeleccionado">
                <p class="text-sm font-medium text-notion-text mb-2 flex items-center gap-1.5">
                  <img
                    v-if="hasEquipoLogo(equipoVisitanteSeleccionado)"
                    :src="getEquipoLogo(equipoVisitanteSeleccionado)"
                    class="w-4 h-4 rounded-full object-cover"
                    @error="() => handleImageError(equipoVisitanteSeleccionado.id)"
                  />
                  {{ equipoVisitanteSeleccionado.nombre }}
                  <span class="text-notion-muted font-normal">({{ form.goles_visitante }} {{ form.goles_visitante === 1 ? 'gol' : 'goles' }})</span>
                </p>
                <div class="space-y-2">
                  <div
                    v-for="(gol, idx) in golesDetalleVisitante"
                    :key="idx"
                    class="flex items-center gap-2 rounded-lg bg-notion-bg/50 border border-notion-border p-2.5"
                  >
                    <span class="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {{ idx + 1 }}
                    </span>
                    <div class="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs text-notion-muted mb-1">Goleador</label>
                        <select
                          v-model="gol.jugador_id"
                          class="w-full rounded border border-notion-border px-2 py-1.5 text-xs text-notion-text bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">— Desconocido —</option>
                          <option
                            v-for="j in jugadoresVisitante"
                            :key="j.id"
                            :value="j.id"
                          >
                            {{ j.nombre }}{{ j.numero_camiseta ? ` #${j.numero_camiseta}` : '' }}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs text-notion-muted mb-1">Asistencia</label>
                        <select
                          v-model="gol.asistente_id"
                          class="w-full rounded border border-notion-border px-2 py-1.5 text-xs text-notion-text bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">— Sin asistencia —</option>
                          <option
                            v-for="j in jugadoresVisitante"
                            :key="j.id"
                            :value="j.id"
                            :disabled="j.id === gol.jugador_id"
                          >
                            {{ j.nombre }}{{ j.numero_camiseta ? ` #${j.numero_camiseta}` : '' }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fecha e información básica -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">
                  Fecha <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.fecha"
                  type="date"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-notion-text mb-2">
                    Hora inicio
                  </label>
                  <input
                    v-model="form.hora_inicio"
                    type="time"
                    class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-notion-text mb-2">
                    Hora fin
                  </label>
                  <input
                    v-model="form.hora_fin"
                    type="time"
                    class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">
                  Lugar
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="form.lugar"
                    type="text"
                    placeholder="Ej: Polideportivo Municipal"
                    class="flex-1 rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    class="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                    @click="updateMap"
                  >
                    Ver mapa
                  </button>
                </div>

                <div
                  v-if="selectedMapUrl"
                  class="w-full h-36 rounded-lg overflow-hidden border border-notion-border mt-2"
                >
                  <iframe
                    :src="selectedMapUrl"
                    style="border: 0"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">
                  Árbitro
                </label>
                <input
                  v-model="form.arbitro"
                  type="text"
                  placeholder="Nombre del árbitro"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">
                  Redactado por
                </label>
                <input
                  v-model="form.redactado_por"
                  type="text"
                  placeholder="Tu nombre"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-notion-text mb-2">
                  Observaciones
                </label>
                <textarea
                  v-model="form.observaciones"
                  placeholder="Notas adicionales..."
                  rows="3"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Tarjetas de jugadores -->
            <div v-if="equipoLocalSeleccionado || equipoVisitanteSeleccionado" class="space-y-4">
              <p class="text-xs font-medium text-notion-muted uppercase tracking-wide">Tarjetas</p>

              <div v-if="equipoLocalSeleccionado && jugadoresLocal.length">
                <p class="text-sm font-medium text-notion-text mb-2">{{ equipoLocalSeleccionado.nombre }}</p>
                <div class="space-y-1.5 max-h-48 overflow-y-auto rounded-lg bg-notion-bg/50 p-3">
                  <div
                    v-for="(jugador, idx) in jugadoresLocal"
                    :key="jugador.id"
                    class="flex items-center gap-2 p-2 rounded bg-white border border-notion-border"
                  >
                    <span class="text-xs text-notion-muted flex-1 truncate">{{ jugador.nombre }}</span>
                    <div class="flex items-center gap-1">
                      <input
                        v-model.number="statsLocal[idx].tarjetas_amarillas"
                        type="number"
                        min="0"
                        placeholder="🟨"
                        title="Tarjetas amarillas"
                        class="w-10 rounded px-1 py-1 text-xs border border-notion-border focus:outline-none focus:ring-2 focus:ring-primary text-center"
                      />
                      <input
                        v-model.number="statsLocal[idx].tarjetas_rojas"
                        type="number"
                        min="0"
                        placeholder="🟥"
                        title="Tarjetas rojas"
                        class="w-10 rounded px-1 py-1 text-xs border border-notion-border focus:outline-none focus:ring-2 focus:ring-primary text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="equipoVisitanteSeleccionado && jugadoresVisitante.length">
                <p class="text-sm font-medium text-notion-text mb-2">{{ equipoVisitanteSeleccionado.nombre }}</p>
                <div class="space-y-1.5 max-h-48 overflow-y-auto rounded-lg bg-notion-bg/50 p-3">
                  <div
                    v-for="(jugador, idx) in jugadoresVisitante"
                    :key="jugador.id"
                    class="flex items-center gap-2 p-2 rounded bg-white border border-notion-border"
                  >
                    <span class="text-xs text-notion-muted flex-1 truncate">{{ jugador.nombre }}</span>
                    <div class="flex items-center gap-1">
                      <input
                        v-model.number="statsVisitante[idx].tarjetas_amarillas"
                        type="number"
                        min="0"
                        placeholder="🟨"
                        title="Tarjetas amarillas"
                        class="w-10 rounded px-1 py-1 text-xs border border-notion-border focus:outline-none focus:ring-2 focus:ring-primary text-center"
                      />
                      <input
                        v-model.number="statsVisitante[idx].tarjetas_rojas"
                        type="number"
                        min="0"
                        placeholder="🟥"
                        title="Tarjetas rojas"
                        class="w-10 rounded px-1 py-1 text-xs border border-notion-border focus:outline-none focus:ring-2 focus:ring-primary text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Confirmación -->
            <div class="flex items-center gap-2">
              <input
                id="confirmado"
                v-model="form.confirmado"
                type="checkbox"
                class="rounded border-notion-border"
              />
              <label for="confirmado" class="text-sm text-notion-text">
                Confirmo que la información es correcta
              </label>
            </div>

            <!-- Feedback de error -->
            <div
              v-if="saveError"
              class="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700"
            >
              {{ saveError }}
            </div>

            <!-- Feedback de éxito -->
            <div
              v-if="saveSuccess"
              class="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-700 flex items-center gap-2"
            >
              <svg
                class="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              Resultado guardado correctamente
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="border-t border-notion-border bg-white px-4 py-4 sm:px-6 flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg border border-notion-border px-4 py-2 text-sm font-medium text-notion-text hover:bg-notion-bg transition-colors"
            @click="closePanel"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            :disabled="saving || !form.confirmado"
            @click="handleSave"
          >
            <svg
              v-if="saving"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ saving ? "Guardando…" : "Guardar resultado" }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.slideover-enter-active,
.slideover-leave-active {
  transition: transform 0.3s ease;
}

.slideover-enter-from,
.slideover-leave-to {
  transform: translateX(100%);
}
</style>
