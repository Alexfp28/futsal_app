<script setup>
import { computed, ref, watch } from "vue";
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

const equipos = ref([]);
const scheduledMatches = ref([]);
const selectedScheduledMatch = ref(null);
const jugadoresLocal = ref([]);
const jugadoresVisitante = ref([]);
const statsLocal = ref([]);
const statsVisitante = ref([]);
const detalleJugadoresLocal = ref([]);
const detalleJugadoresVisitante = ref([]);
const currentMapQuery = ref("Polideportivo Municipal");

const equiposVisitante = computed(() =>
  equipos.value.filter((equipo) => equipo.id !== form.value.equipo_local_id)
);

const equipoLocalSeleccionado = computed(() =>
  equipos.value.find((equipo) => equipo.id === form.value.equipo_local_id)
);

const equipoVisitanteSeleccionado = computed(() =>
  equipos.value.find((equipo) => equipo.id === form.value.equipo_visitante_id)
);

const selectedMapUrl = computed(() => {
  if (!currentMapQuery.value) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(currentMapQuery.value)}&hl=es&z=15&output=embed`;
});

const totalGolesDetalleLocal = computed(() =>
  detalleJugadoresLocal.value.reduce((acc, item) => acc + (Number(item.goles) || 0), 0)
);

const totalGolesDetalleVisitante = computed(() =>
  detalleJugadoresVisitante.value.reduce((acc, item) => acc + (Number(item.goles) || 0), 0)
);

const necesitaDetalleJugadores = computed(
  () =>
    (Number(form.value.goles_local) > 0 && equipoLocalSeleccionado.value) ||
    (Number(form.value.goles_visitante) > 0 && equipoVisitanteSeleccionado.value)
);

watch(
  () => selectedScheduledMatch.value,
  (selectedId) => {
    if (!selectedId) return;

    const match = scheduledMatches.value.find((item) => item.id === selectedId);
    if (!match) return;

    form.value.equipo_local_id = match.equipo_local_id;
    form.value.equipo_visitante_id = match.equipo_visitante_id;
    form.value.fecha = new Date(match.fecha).toISOString().slice(0, 10);
    form.value.lugar = match.lugar;
  }
);

watch(
  () => form.value.equipo_local_id,
  async (newId) => {
    jugadoresLocal.value = await fetchJugadoresByEquipo(newId);
    statsLocal.value = jugadoresLocal.value.map((jugador) => ({
      jugador_id: jugador.id,
      goles: 0,
      asistencias: 0,
      tarjetas_amarillas: 0,
      tarjetas_rojas: 0,
    }));
    detalleJugadoresLocal.value = normalizeDetalleRows(detalleJugadoresLocal.value, jugadoresLocal.value);
  }
);

watch(
  () => form.value.equipo_visitante_id,
  async (newId) => {
    jugadoresVisitante.value = await fetchJugadoresByEquipo(newId);
    statsVisitante.value = jugadoresVisitante.value.map((jugador) => ({
      jugador_id: jugador.id,
      goles: 0,
      asistencias: 0,
      tarjetas_amarillas: 0,
      tarjetas_rojas: 0,
    }));
    detalleJugadoresVisitante.value = normalizeDetalleRows(
      detalleJugadoresVisitante.value,
      jugadoresVisitante.value
    );
  }
);

watch(
  () => form.value.goles_local,
  (goles) => {
    detalleJugadoresLocal.value = syncDetalleRowsWithGoals(
      detalleJugadoresLocal.value,
      Number(goles) || 0
    );
  },
  { immediate: true }
);

watch(
  () => form.value.goles_visitante,
  (goles) => {
    detalleJugadoresVisitante.value = syncDetalleRowsWithGoals(
      detalleJugadoresVisitante.value,
      Number(goles) || 0
    );
  },
  { immediate: true }
);

watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      await initializePanel();
    }
  },
  { immediate: true }
);

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
  detalleJugadoresLocal.value = [];
  detalleJugadoresVisitante.value = [];
  currentMapQuery.value = "Polideportivo Municipal";

  if (equipos.value.length === 0) {
    await fetchEquipos();
  }
  await fetchScheduledMatches();
};

const fetchEquipos = async () => {
  const { data } = await supabase
    .from("equipos")
    .select("id, nombre, color_principal, escudo_url")
    .order("nombre");

  equipos.value = data || [];
};

const fetchJugadoresByEquipo = async (equipoId) => {
  if (!equipoId) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre, numero_camiseta, posicion")
    .eq("equipo_id", equipoId)
    .in("rol", ["jugador", "capitan"])
    .order("nombre");

  if (error) {
    console.error("Error cargando jugadores por equipo:", error);
    return [];
  }

  if (data?.length) {
    return data;
  }

  const { data: plantillaData, error: plantillaError } = await supabase
    .from("plantilla")
    .select(
      "jugador_id, perfil:profiles!plantilla_jugador_id_fkey(id, nombre, numero_camiseta, posicion)"
    )
    .eq("equipo_id", equipoId);

  if (plantillaError) {
    console.error("Error cargando jugadores desde plantilla:", plantillaError);
    return [];
  }

  return (plantillaData || [])
    .map((item) => item.perfil)
    .filter(Boolean)
    .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
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

function createDetalleRow() {
  return {
    jugador_id: "",
    goles: 0,
    asistencias: 0,
  };
}

function normalizeDetalleRows(rows = [], jugadores = []) {
  const validPlayerIds = new Set(jugadores.map((jugador) => jugador.id));
  return (rows || []).map((row) => ({
    jugador_id: validPlayerIds.has(row.jugador_id) ? row.jugador_id : "",
    goles: Number(row.goles) || 0,
    asistencias: Number(row.asistencias) || 0,
  }));
}

function syncDetalleRowsWithGoals(rows = [], targetGoals = 0) {
  if (targetGoals <= 0) return [];

  const normalizedRows = rows.length
    ? rows.map((row) => ({
        jugador_id: row.jugador_id || "",
        goles: Number(row.goles) || 0,
        asistencias: Number(row.asistencias) || 0,
      }))
    : [createDetalleRow()];

  const totalGoals = normalizedRows.reduce((acc, row) => acc + row.goles, 0);
  if (totalGoals === 0) {
    normalizedRows[0].goles = targetGoals;
  }

  return normalizedRows;
}

const addDetalleRow = (side) => {
  if (side === "local") {
    detalleJugadoresLocal.value = [...detalleJugadoresLocal.value, createDetalleRow()];
    return;
  }

  detalleJugadoresVisitante.value = [...detalleJugadoresVisitante.value, createDetalleRow()];
};

const removeDetalleRow = (side, index) => {
  if (side === "local") {
    detalleJugadoresLocal.value = detalleJugadoresLocal.value.filter((_, idx) => idx !== index);
    if (detalleJugadoresLocal.value.length === 0 && Number(form.value.goles_local) > 0) {
      detalleJugadoresLocal.value = [createDetalleRow()];
    }
    return;
  }

  detalleJugadoresVisitante.value = detalleJugadoresVisitante.value.filter((_, idx) => idx !== index);
  if (detalleJugadoresVisitante.value.length === 0 && Number(form.value.goles_visitante) > 0) {
    detalleJugadoresVisitante.value = [createDetalleRow()];
  }
};

function getDetalleSummary(rows = []) {
  return rows.reduce(
    (acc, row) => {
      acc.goles += Number(row.goles) || 0;
      acc.asistencias += Number(row.asistencias) || 0;
      return acc;
    },
    { goles: 0, asistencias: 0 }
  );
}

function hasIncompleteDetalleRows(rows = []) {
  return rows.some((row) => {
    const goles = Number(row.goles) || 0;
    const asistencias = Number(row.asistencias) || 0;
    return (goles > 0 || asistencias > 0) && !row.jugador_id;
  });
}

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

  if (
    Number(form.value.goles_local) > 0 &&
    totalGolesDetalleLocal.value !== Number(form.value.goles_local)
  ) {
    saveError.value = "Los goles asignados al equipo local deben coincidir con el marcador.";
    return;
  }

  if (
    Number(form.value.goles_visitante) > 0 &&
    totalGolesDetalleVisitante.value !== Number(form.value.goles_visitante)
  ) {
    saveError.value = "Los goles asignados al equipo visitante deben coincidir con el marcador.";
    return;
  }

  if (hasIncompleteDetalleRows(detalleJugadoresLocal.value)) {
    saveError.value =
      "Selecciona un jugador en cada fila del equipo local que tenga goles o asistencias.";
    return;
  }

  if (hasIncompleteDetalleRows(detalleJugadoresVisitante.value)) {
    saveError.value =
      "Selecciona un jugador en cada fila del equipo visitante que tenga goles o asistencias.";
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
      const { error: updateError } = await supabase
        .from("partidos")
        .update(partidoData)
        .eq("id", selectedScheduledMatch.value);

      if (updateError) throw updateError;
      partidoId = selectedScheduledMatch.value;
    } else {
      const { data, error: insertError } = await supabase
        .from("partidos")
        .insert(partidoData)
        .select("id")
        .single();

      if (insertError) throw insertError;
      partidoId = data.id;
    }

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

    [...detalleJugadoresLocal.value, ...detalleJugadoresVisitante.value].forEach((detalle) => {
      if (detalle.goles) {
        addStat(detalle.jugador_id, "goles", Number(detalle.goles));
      }
      if (detalle.asistencias) {
        addStat(detalle.jugador_id, "asistencias", Number(detalle.asistencias));
      }
    });

    [...statsLocal.value, ...statsVisitante.value].forEach((stat) => {
      if (!stat.jugador_id) return;
      if (stat.tarjetas_amarillas) {
        addStat(stat.jugador_id, "tarjetas_amarillas", stat.tarjetas_amarillas);
      }
      if (stat.tarjetas_rojas) {
        addStat(stat.jugador_id, "tarjetas_rojas", stat.tarjetas_rojas);
      }
    });

    const allStats = Object.values(statsMap).filter(
      (stat) => stat.goles || stat.asistencias || stat.tarjetas_amarillas || stat.tarjetas_rojas
    );

    const { error: deleteStatsError } = await supabase
      .from("estadisticas_partido_jugador")
      .delete()
      .eq("partido_id", partidoId);

    if (deleteStatsError) throw deleteStatsError;

    if (allStats.length > 0) {
      const { error: statsError } = await supabase
        .from("estadisticas_partido_jugador")
        .upsert(allStats, { onConflict: "partido_id,jugador_id" });

      if (statsError) throw statsError;
    }

    saveSuccess.value = true;
    emit("resultado-saved");

    setTimeout(() => {
      saveSuccess.value = false;
      emit("close");
    }, 1800);
  } catch (error) {
    console.error("Error guardando resultado:", error);
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
    <Transition name="backdrop">
      <div
        v-if="show"
        class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        @click="closePanel"
      />
    </Transition>

    <Transition name="slideover">
      <div
        v-if="show"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-notion-border bg-white px-4 py-3 sm:px-6">
          <h2 class="text-lg font-semibold text-notion-text">Registrar resultado</h2>
          <button
            type="button"
            class="text-notion-muted transition-colors hover:text-notion-text"
            @click="closePanel"
          >
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <form class="space-y-6 px-4 py-6 sm:px-6">
            <div>
              <label class="mb-2 block text-sm font-medium text-notion-text">
                Seleccionar partido programado (opcional)
              </label>
              <select
                v-model="selectedScheduledMatch"
                class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Ninguno --</option>
                <option v-for="match in scheduledMatches" :key="match.id" :value="match.id">
                  {{ match.equipo_local?.nombre }} vs
                  {{ match.equipo_visitante?.nombre }} ({{
                    new Date(match.fecha).toLocaleDateString("es-ES")
                  }})
                </option>
              </select>
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">
                  Equipo local <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.equipo_local_id"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Selecciona un equipo --</option>
                  <option v-for="equipo in equipos" :key="equipo.id" :value="equipo.id">
                    {{ equipo.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">
                  Equipo visitante <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.equipo_visitante_id"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Selecciona un equipo --</option>
                  <option v-for="equipo in equiposVisitante" :key="equipo.id" :value="equipo.id">
                    {{ equipo.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <div class="rounded-lg bg-notion-bg/50 p-4">
              <p class="mb-3 text-xs font-medium uppercase text-notion-muted">Marcador</p>
              <div class="flex items-center justify-between gap-3">
                <div class="flex-1 text-center">
                  <img
                    v-if="hasEquipoLogo(equipoLocalSeleccionado)"
                    :src="getEquipoLogo(equipoLocalSeleccionado)"
                    :alt="`Escudo de ${equipoLocalSeleccionado?.nombre || 'Local'}`"
                    class="mx-auto mb-1.5 h-10 w-10 rounded-full border border-notion-border bg-white object-cover"
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
                  <span class="flex items-center text-notion-muted">-</span>
                  <input
                    v-model.number="form.goles_visitante"
                    type="number"
                    min="0"
                    class="w-14 rounded-lg border border-notion-border bg-white px-2 py-2 text-center text-lg font-bold text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div class="flex-1 text-center">
                  <img
                    v-if="hasEquipoLogo(equipoVisitanteSeleccionado)"
                    :src="getEquipoLogo(equipoVisitanteSeleccionado)"
                    :alt="`Escudo de ${equipoVisitanteSeleccionado?.nombre || 'Visitante'}`"
                    class="mx-auto mb-1.5 h-10 w-10 rounded-full border border-notion-border bg-white object-cover"
                    @error="() => handleImageError(equipoVisitanteSeleccionado?.id)"
                  />
                  <p class="text-xs text-notion-muted">
                    {{ equipoVisitanteSeleccionado?.nombre || "Visitante" }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-if="necesitaDetalleJugadores"
              class="space-y-4 rounded-2xl border border-notion-border bg-white p-4 shadow-sm"
            >
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-notion-muted">
                  Introducir detalles
                </p>
                <p class="mt-1 text-sm text-notion-muted">
                  Reparte los goles y asistencias entre los jugadores. Los goles deben cuadrar con el marcador.
                </p>
              </div>

              <div
                v-if="form.goles_local > 0 && equipoLocalSeleccionado"
                class="space-y-3 rounded-xl border border-notion-border bg-notion-bg/40 p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="flex items-center gap-2 text-sm font-medium text-notion-text">
                    <img
                      v-if="hasEquipoLogo(equipoLocalSeleccionado)"
                      :src="getEquipoLogo(equipoLocalSeleccionado)"
                      class="h-5 w-5 rounded-full object-cover"
                      @error="() => handleImageError(equipoLocalSeleccionado.id)"
                    />
                    {{ equipoLocalSeleccionado.nombre }}
                  </p>
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="
                      totalGolesDetalleLocal === Number(form.goles_local)
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    "
                  >
                    {{ totalGolesDetalleLocal }}/{{ form.goles_local }} goles asignados
                  </span>
                </div>

                <div class="space-y-2">
                  <div
                    v-for="(detalle, idx) in detalleJugadoresLocal"
                    :key="`local-${idx}`"
                    class="grid grid-cols-1 gap-2 rounded-xl border border-notion-border bg-white p-3 sm:grid-cols-[minmax(0,1fr)_88px_104px_40px]"
                  >
                    <div>
                      <label class="mb-1 block text-xs text-notion-muted">Jugador</label>
                      <select
                        v-model="detalle.jugador_id"
                        class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Selecciona jugador</option>
                        <option v-for="j in jugadoresLocal" :key="j.id" :value="j.id">
                          {{ j.nombre }}{{ j.numero_camiseta ? ` #${j.numero_camiseta}` : "" }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs text-notion-muted">Goles</label>
                      <input
                        v-model.number="detalle.goles"
                        type="number"
                        min="0"
                        class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-xs text-notion-muted">Asistencias</label>
                      <input
                        v-model.number="detalle.asistencias"
                        type="number"
                        min="0"
                        class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div class="flex items-end">
                      <button
                        type="button"
                        class="h-10 w-10 rounded-lg border border-notion-border text-notion-muted transition-colors hover:bg-notion-bg hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="detalleJugadoresLocal.length === 1"
                        @click="removeDetalleRow('local', idx)"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs text-notion-muted">
                    {{ getDetalleSummary(detalleJugadoresLocal).asistencias }} asistencias registradas
                  </p>
                  <button
                    type="button"
                    class="rounded-lg border border-notion-border px-3 py-2 text-sm font-medium text-notion-text transition-colors hover:bg-white"
                    @click="addDetalleRow('local')"
                  >
                    Añadir jugador
                  </button>
                </div>
              </div>

              <div
                v-if="form.goles_visitante > 0 && equipoVisitanteSeleccionado"
                class="space-y-3 rounded-xl border border-notion-border bg-notion-bg/40 p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="flex items-center gap-2 text-sm font-medium text-notion-text">
                    <img
                      v-if="hasEquipoLogo(equipoVisitanteSeleccionado)"
                      :src="getEquipoLogo(equipoVisitanteSeleccionado)"
                      class="h-5 w-5 rounded-full object-cover"
                      @error="() => handleImageError(equipoVisitanteSeleccionado.id)"
                    />
                    {{ equipoVisitanteSeleccionado.nombre }}
                  </p>
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="
                      totalGolesDetalleVisitante === Number(form.goles_visitante)
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    "
                  >
                    {{ totalGolesDetalleVisitante }}/{{ form.goles_visitante }} goles asignados
                  </span>
                </div>

                <div class="space-y-2">
                  <div
                    v-for="(detalle, idx) in detalleJugadoresVisitante"
                    :key="`visitante-${idx}`"
                    class="grid grid-cols-1 gap-2 rounded-xl border border-notion-border bg-white p-3 sm:grid-cols-[minmax(0,1fr)_88px_104px_40px]"
                  >
                    <div>
                      <label class="mb-1 block text-xs text-notion-muted">Jugador</label>
                      <select
                        v-model="detalle.jugador_id"
                        class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Selecciona jugador</option>
                        <option v-for="j in jugadoresVisitante" :key="j.id" :value="j.id">
                          {{ j.nombre }}{{ j.numero_camiseta ? ` #${j.numero_camiseta}` : "" }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs text-notion-muted">Goles</label>
                      <input
                        v-model.number="detalle.goles"
                        type="number"
                        min="0"
                        class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-xs text-notion-muted">Asistencias</label>
                      <input
                        v-model.number="detalle.asistencias"
                        type="number"
                        min="0"
                        class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div class="flex items-end">
                      <button
                        type="button"
                        class="h-10 w-10 rounded-lg border border-notion-border text-notion-muted transition-colors hover:bg-notion-bg hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="detalleJugadoresVisitante.length === 1"
                        @click="removeDetalleRow('visitante', idx)"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs text-notion-muted">
                    {{ getDetalleSummary(detalleJugadoresVisitante).asistencias }} asistencias registradas
                  </p>
                  <button
                    type="button"
                    class="rounded-lg border border-notion-border px-3 py-2 text-sm font-medium text-notion-text transition-colors hover:bg-white"
                    @click="addDetalleRow('visitante')"
                  >
                    Añadir jugador
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">
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
                  <label class="mb-2 block text-sm font-medium text-notion-text">Hora inicio</label>
                  <input
                    v-model="form.hora_inicio"
                    type="time"
                    class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-notion-text">Hora fin</label>
                  <input
                    v-model="form.hora_fin"
                    type="time"
                    class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">Lugar</label>
                <div class="flex gap-2">
                  <input
                    v-model="form.lugar"
                    type="text"
                    placeholder="Ej: Polideportivo Municipal"
                    class="flex-1 rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    class="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                    @click="updateMap"
                  >
                    Ver mapa
                  </button>
                </div>

                <div
                  v-if="selectedMapUrl"
                  class="mt-2 h-36 w-full overflow-hidden rounded-lg border border-notion-border"
                >
                  <iframe
                    :src="selectedMapUrl"
                    class="h-full w-full"
                    style="border: 0"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">Árbitro</label>
                <input
                  v-model="form.arbitro"
                  type="text"
                  placeholder="Nombre del árbitro"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">Redactado por</label>
                <input
                  v-model="form.redactado_por"
                  type="text"
                  placeholder="Tu nombre"
                  class="w-full rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">Observaciones</label>
                <textarea
                  v-model="form.observaciones"
                  rows="3"
                  placeholder="Notas adicionales..."
                  class="w-full resize-none rounded-lg border border-notion-border px-3 py-2 text-sm text-notion-text placeholder-notion-muted focus:outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
              </div>
            </div>

            <div v-if="equipoLocalSeleccionado || equipoVisitanteSeleccionado" class="space-y-4">
              <p class="text-xs font-medium uppercase tracking-wide text-notion-muted">Tarjetas</p>

              <div v-if="equipoLocalSeleccionado && jugadoresLocal.length">
                <p class="mb-2 text-sm font-medium text-notion-text">
                  {{ equipoLocalSeleccionado.nombre }}
                </p>
                <div class="max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-notion-bg/50 p-3">
                  <div
                    v-for="(jugador, idx) in jugadoresLocal"
                    :key="jugador.id"
                    class="flex items-center gap-2 rounded border border-notion-border bg-white p-2"
                  >
                    <span class="flex-1 truncate text-xs text-notion-muted">{{ jugador.nombre }}</span>
                    <div class="flex items-center gap-1">
                      <input
                        v-model.number="statsLocal[idx].tarjetas_amarillas"
                        type="number"
                        min="0"
                        title="Tarjetas amarillas"
                        class="w-10 rounded border border-notion-border px-1 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        v-model.number="statsLocal[idx].tarjetas_rojas"
                        type="number"
                        min="0"
                        title="Tarjetas rojas"
                        class="w-10 rounded border border-notion-border px-1 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="equipoVisitanteSeleccionado && jugadoresVisitante.length">
                <p class="mb-2 text-sm font-medium text-notion-text">
                  {{ equipoVisitanteSeleccionado.nombre }}
                </p>
                <div class="max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-notion-bg/50 p-3">
                  <div
                    v-for="(jugador, idx) in jugadoresVisitante"
                    :key="jugador.id"
                    class="flex items-center gap-2 rounded border border-notion-border bg-white p-2"
                  >
                    <span class="flex-1 truncate text-xs text-notion-muted">{{ jugador.nombre }}</span>
                    <div class="flex items-center gap-1">
                      <input
                        v-model.number="statsVisitante[idx].tarjetas_amarillas"
                        type="number"
                        min="0"
                        title="Tarjetas amarillas"
                        class="w-10 rounded border border-notion-border px-1 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        v-model.number="statsVisitante[idx].tarjetas_rojas"
                        type="number"
                        min="0"
                        title="Tarjetas rojas"
                        class="w-10 rounded border border-notion-border px-1 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

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

            <div
              v-if="saveError"
              class="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
            >
              {{ saveError }}
            </div>

            <div
              v-if="saveSuccess"
              class="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700"
            >
              <svg
                class="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4Z"
                  clip-rule="evenodd"
                />
              </svg>
              Resultado guardado correctamente
            </div>
          </form>
        </div>

        <div class="flex gap-2 border-t border-notion-border bg-white px-4 py-4 sm:px-6">
          <button
            type="button"
            class="flex-1 rounded-lg border border-notion-border px-4 py-2 text-sm font-medium text-notion-text transition-colors hover:bg-notion-bg"
            @click="closePanel"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving || !form.confirmado"
            @click="handleSave"
          >
            <svg
              v-if="saving"
              class="h-4 w-4 animate-spin"
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
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z"
              ></path>
            </svg>
            {{ saving ? "Guardando..." : "Guardar resultado" }}
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
