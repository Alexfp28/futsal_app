<script setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  CalendarDaysIcon,
  ListBulletIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const canManage = computed(() => authStore.isAdmin);

const loading = ref(true);
const error = ref("");
const rows = ref([]);
const showLegend = ref(false);
const viewMode = ref("tabla"); // 'tabla' | 'tarjetas'

// ── Panel lateral de registro de resultado ──────────────────────────────────
const showPanel = ref(false);
const equipos = ref([]);
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

// Scheduled matches
const scheduledMatches = ref([]);
const selectedScheduledMatch = ref(null);

// Player rosters
const jugadoresLocal = ref([]);
const jugadoresVisitante = ref([]);

// Match statistics (per player per team)
const statsLocal = ref([]);
const statsVisitante = ref([]);

const currentMapQuery = ref("Polideportivo Municipal");

const equiposVisitante = computed(() =>
  equipos.value.filter((e) => e.id !== form.value.equipo_local_id),
);
const equipoLocalSeleccionado = computed(() =>
  equipos.value.find((e) => e.id === form.value.equipo_local_id),
);
const equipoVisitanteSeleccionado = computed(() =>
  equipos.value.find((e) => e.id === form.value.equipo_visitante_id),
);

const getEquipoLogo = (equipo) => equipo?.logo_url || equipo?.escudo_url || null;

const hasEquipoLogo = (equipo) =>
  Boolean(getEquipoLogo(equipo)) && !imageErrors.value[equipo?.id];

const handleImageError = (equipoId) => {
  imageErrors.value = {
    ...imageErrors.value,
    [equipoId]: true,
  };
};

const watch = (import('vue')).then(m => m.watch);

// Watchers para cargar jugadores cuando cambian los equipos
(async () => {
  const { watch } = await import('vue');

  // Watch selected scheduled match to auto-fill form
  watch(() => selectedScheduledMatch.value, (selectedId) => {
    if (selectedId) {
      const match = scheduledMatches.value.find((m) => m.id === selectedId);
      if (match) {
        form.value.equipo_local_id = match.equipo_local_id;
        form.value.equipo_visitante_id = match.equipo_visitante_id;
        form.value.fecha = new Date(match.fecha).toISOString().slice(0, 10);
        form.value.lugar = match.lugar;
      }
    }
  });

  watch(() => form.value.equipo_local_id, async (newId) => {
    jugadoresLocal.value = await fetchJugadoresByEquipo(newId);
    statsLocal.value = [];
  });
  watch(() => form.value.equipo_visitante_id, async (newId) => {
    jugadoresVisitante.value = await fetchJugadoresByEquipo(newId);
    statsVisitante.value = [];
  });
})();

const fetchEquipos = async () => {
  const { data } = await supabase
    .from("equipos")
    .select("id, nombre, color_principal, escudo_url")
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
      "id, fecha, lugar, equipo_local_id, equipo_visitante_id, equipo_local:equipos!partidos_equipo_local_id_fkey(nombre), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre)",
    )
    .eq("estado", "programado")
    .order("fecha");
  scheduledMatches.value = data || [];
};

const selectedMapUrl = computed(() => {
  if (!currentMapQuery.value) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(currentMapQuery.value)}&hl=es&z=15&output=embed`;
});

const updateMap = () => {
  if (form.value.lugar) {
    currentMapQuery.value = form.value.lugar;
  }
};

const openPanel = async () => {
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
  currentMapQuery.value = "Polideportivo Municipal";

  if (equipos.value.length === 0) await fetchEquipos();
  await fetchScheduledMatches();
  showPanel.value = true;
};

const closePanel = () => {
  showPanel.value = false;
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

    // Insert player statistics
    const allStats = [...statsLocal.value, ...statsVisitante.value]
      .filter(
        (s) =>
          s.jugador_id &&
          (s.goles || s.asistencias || s.tarjetas_amarillas || s.tarjetas_rojas),
      )
      .map((s) => ({
        partido_id: partidoId,
        jugador_id: s.jugador_id,
        goles: s.goles || 0,
        asistencias: s.asistencias || 0,
        tarjetas_amarillas: s.tarjetas_amarillas || 0,
        tarjetas_rojas: s.tarjetas_rojas || 0,
      }));

    if (allStats.length > 0) {
      const { error: statsError } = await supabase
        .from("estadisticas_partido_jugador")
        .insert(allStats);
      if (statsError) throw statsError;
    }

    saveSuccess.value = true;
    await fetchClasificacion();

    setTimeout(() => {
      saveSuccess.value = false;
      closePanel();
    }, 1800);
  } catch (e) {
    console.error("Error guardando resultado:", e);
    saveError.value = "No se pudo guardar el resultado. Inténtalo de nuevo.";
  } finally {
    saving.value = false;
  }
};

// ── Carga de clasificación ──────────────────────────────────────────────────
const fetchClasificacion = async () => {
  loading.value = true;
  error.value = "";
  imageErrors.value = {};

  try {
    const { data, error: supabaseError } = await supabase
      .from("clasificacion")
      .select("*")
      .order("pts", { ascending: false });

    if (supabaseError) throw supabaseError;

    rows.value = (data || []).map((row) => {
      const partidosJugados = row.partidos_jugados ?? 0;
      const ganados = row.ganados ?? null;
      const empatados = row.empatados ?? null;
      const perdidos = row.perdidos ?? null;
      const golesFavor = row.gf ?? null;
      const golesContra = row.gc ?? null;

      const diferenciaGoles = row.dg ?? null;

      const totalPuntos = row.pts ?? 0;

      const porcentajeAprovechamiento =
        row.porcentaje_aprovechamiento ??
        (partidosJugados > 0
          ? Number(((totalPuntos / (partidosJugados * 3)) * 100).toFixed(1))
          : null);

      return {
        ...row,
        partidosJugados,
        ganados,
        empatados,
        perdidos,
        golesFavor,
        golesContra,
        diferenciaGoles,
        totalPuntos,
        porcentajeAprovechamiento,
      };
    });
  } catch (e) {
    console.error("Error cargando clasificación:", e);
    error.value = "No se pudo cargar la clasificación. Inténtalo más tarde.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchClasificacion);
</script>

<template>
  <div class="w-full">
    <!-- Estados de carga / error -->
    <div v-if="loading" class="flex justify-center py-8">
      <div
        class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"
      ></div>
    </div>

    <div
      v-else-if="error"
      class="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div v-else>
      <!-- Sin datos -->
      <div
        v-if="rows.length === 0 && !canManage"
        class="px-3 py-6 text-center text-sm text-notion-muted"
      >
        Todavía no hay datos de clasificación disponibles.
      </div>

      <div class="space-y-4">
        <!-- Encabezado y botones -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h3 class="text-sm font-semibold text-notion-text">Clasificación</h3>
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Botón leyenda -->
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-notion-border px-3 py-1 text-xs font-medium text-notion-muted hover:text-notion-text hover:bg-notion-bg transition-colors"
              @click="showLegend = !showLegend"
            >
              <span>{{
                showLegend ? "Ocultar leyenda" : "Más información"
              }}</span>
              <span
                class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-notion-bg text-[10px]"
              >
                i
              </span>
            </button>

            <!-- Toggle de vista -->
            <div class="flex items-center rounded-lg border border-notion-border overflow-hidden">
              <button
                type="button"
                :class="[
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                  viewMode === 'tabla'
                    ? 'bg-primary text-white'
                    : 'text-notion-muted hover:bg-notion-bg',
                ]"
                @click="viewMode = 'tabla'"
                title="Vista tabla"
              >
                <CalendarDaysIcon class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Tabla</span>
              </button>
              <button
                type="button"
                :class="[
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
                  viewMode === 'tarjetas'
                    ? 'bg-primary text-white'
                    : 'text-notion-muted hover:bg-notion-bg',
                ]"
                @click="viewMode = 'tarjetas'"
                title="Vista tarjetas"
              >
                <ListBulletIcon class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Tarjetas</span>
              </button>
            </div>

            <!-- Botón registrar resultado (solo admin/capitán) -->
            <button
              v-if="canManage"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-600 transition-colors shadow-sm"
              @click="openPanel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Registrar resultado
            </button>
          </div>
        </div>

        <!-- Leyenda de campos -->
        <div
          v-if="showLegend"
          class="rounded-lg border border-notion-border bg-notion-bg/80 px-3 py-3 text-[11px] text-notion-muted space-y-2"
        >
          <p class="font-medium text-notion-text text-xs">Leyenda de campos</p>
          <div class="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            <div>
              <span class="font-semibold text-notion-text">Pos</span>
              <span> · Posición en la tabla.</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">Pts</span>
              <span> · Puntos totales.</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">Juegos / PJ</span>
              <span> · Partidos jugados.</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">G</span>
              <span> · Partidos ganados.</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">E</span>
              <span> · Partidos empatados.</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">P</span>
              <span> · Partidos perdidos.</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">GF</span>
              <span> · Goles a favor.</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">GC</span>
              <span> · Goles en contra.</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">Dif</span>
              <span> · Diferencia de goles (GF - GC).</span>
            </div>
            <div>
              <span class="font-semibold text-notion-text">% Aprov.</span>
              <span>
                · Porcentaje de puntos obtenidos sobre el máximo posible.
              </span>
            </div>
          </div>
        </div>

        <!-- Vista tarjetas -->
        <div v-show="viewMode === 'tarjetas'" v-if="rows.length > 0" class="space-y-3">
          <div
            v-for="(row, index) in rows"
            :key="row.id"
            class="border border-notion-border rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <!-- Encabezado: posición + equipo + puntos -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-7 h-7 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center"
                >
                  {{ index + 1 }}
                </div>
                <div class="flex items-center gap-2 min-w-0">
                  <img
                    v-if="hasEquipoLogo(row)"
                    :src="getEquipoLogo(row)"
                    :alt="`Escudo de ${row.nombre}`"
                    class="w-7 h-7 rounded-full object-cover shrink-0 border border-notion-border bg-white"
                    @error="handleImageError(row.id)"
                  />
                  <span
                    v-else
                    class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                    :style="{
                      backgroundColor: row.color_principal || '#164bf0',
                    }"
                  >
                    {{ row.nombre?.charAt(0) || "E" }}
                  </span>
                  <span class="font-medium text-notion-text text-sm truncate">
                    {{ row.nombre }}
                  </span>
                </div>
              </div>

              <div class="text-right shrink-0 ml-2">
                <p class="text-[11px] text-notion-muted leading-tight">
                  Puntos
                </p>
                <p class="text-lg font-semibold text-notion-text leading-tight">
                  {{ row.totalPuntos }}
                </p>
                <p class="text-[11px] text-notion-muted leading-tight">
                  {{ row.partidosJugados }} PJ
                </p>
              </div>
            </div>

            <!-- Bloque estadísticas principales -->
            <div class="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div class="space-y-0.5">
                <p class="text-notion-muted uppercase tracking-wide">
                  Resultado
                </p>
                <p class="text-notion-text">
                  G {{ row.ganados ?? "—" }} · E {{ row.empatados ?? "—" }} · P
                  {{ row.perdidos ?? "—" }}
                </p>
              </div>
              <div class="space-y-0.5">
                <p class="text-notion-muted uppercase tracking-wide">Goles</p>
                <p class="text-notion-text">
                  GF {{ row.golesFavor ?? "—" }} · GC
                  {{ row.golesContra ?? "—" }}
                </p>
              </div>
              <div class="space-y-0.5 text-right">
                <p class="text-notion-muted uppercase tracking-wide">
                  Dif / % Aprov.
                </p>
                <p class="text-notion-text">
                  Dif
                  {{ row.diferenciaGoles ?? "—" }}
                  <span v-if="row.porcentajeAprovechamiento !== null">
                    · {{ row.porcentajeAprovechamiento }}%
                  </span>
                </p>
              </div>
            </div>

          </div>
        </div>

        <!-- Vista tabla -->
        <div v-show="viewMode === 'tabla'" v-if="rows.length > 0" class="overflow-x-auto">
          <table class="min-w-full table-auto text-sm">
            <thead>
              <tr class="bg-notion-bg text-notion-muted">
                <th class="px-3 py-2 text-left">Pos</th>
                <th class="px-3 py-2 text-left">Equipo</th>
                <th class="px-3 py-2 text-right">Pts</th>
                <th class="px-3 py-2 text-right">Juegos</th>
                <th class="px-3 py-2 text-right">G</th>
                <th class="px-3 py-2 text-right">E</th>
                <th class="px-3 py-2 text-right">P</th>
                <th class="px-3 py-2 text-right">GF</th>
                <th class="px-3 py-2 text-right">GC</th>
                <th class="px-3 py-2 text-right">Dif</th>
                <th class="px-3 py-2 text-right">% Aprov.</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in rows"
                :key="row.id"
                class="border-t border-notion-border hover:bg-notion-bg/60 transition-colors"
              >
                <td class="px-3 py-2 text-notion-muted text-xs">
                  {{ index + 1 }}
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="hasEquipoLogo(row)"
                      :src="getEquipoLogo(row)"
                      :alt="`Escudo de ${row.nombre}`"
                      class="w-6 h-6 rounded-full object-cover border border-notion-border bg-white"
                      @error="handleImageError(row.id)"
                    />
                    <span
                      v-else
                      class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      :style="{
                        backgroundColor: row.color_principal || '#164bf0',
                      }"
                    >
                      {{ row.nombre?.charAt(0) || "E" }}
                    </span>
                    <span class="font-medium text-notion-text">
                      {{ row.nombre }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2 text-right font-semibold text-notion-text">
                  {{ row.totalPuntos }}
                </td>
                <td class="px-3 py-2 text-right">
                  {{ row.partidosJugados }}
                </td>
                <td class="px-3 py-2 text-right">
                  {{ row.ganados ?? "—" }}
                </td>
                <td class="px-3 py-2 text-right">
                  {{ row.empatados ?? "—" }}
                </td>
                <td class="px-3 py-2 text-right">
                  {{ row.perdidos ?? "—" }}
                </td>
                <td class="px-3 py-2 text-right">
                  {{ row.golesFavor ?? "—" }}
                </td>
                <td class="px-3 py-2 text-right">
                  {{ row.golesContra ?? "—" }}
                </td>
                <td class="px-3 py-2 text-right">
                  {{ row.diferenciaGoles ?? "—" }}
                </td>
                <td class="px-3 py-2 text-right">
                  <span v-if="row.porcentajeAprovechamiento !== null">
                    {{ row.porcentajeAprovechamiento }}%
                  </span>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mensaje vacío para admin/capitan -->
        <div
          v-if="rows.length === 0 && canManage"
          class="px-3 py-6 text-center text-sm text-notion-muted"
        >
          Todavía no hay datos de clasificación disponibles. Registra el primer
          resultado con el botón de arriba.
        </div>
      </div>
    </div>

    <!-- ── Overlay backdrop ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="showPanel"
          class="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          @click="closePanel"
        />
      </Transition>

      <!-- ── Slide-over panel ──────────────────────────────────────────── -->
      <Transition name="slideover">
        <div
          v-if="showPanel"
          class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl"
          @click.stop
        >
          <!-- Header del panel -->
          <div
            class="flex items-center justify-between border-b border-notion-border px-6 py-4"
          >
            <div>
              <h2 class="text-base font-semibold text-notion-text">
                Acta de partido - FutsalVall 2.0
              </h2>
              <p class="text-xs text-notion-muted mt-0.5">
                Completa esta acta al finalizar cada partido. La información será validada por la Dirección Deportiva.
              </p>
            </div>
            <button
              type="button"
              class="rounded-full p-1.5 text-notion-muted hover:bg-notion-bg hover:text-notion-text transition-colors"
              @click="closePanel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>

          <!-- Cuerpo del formulario -->
          <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <!-- Marcador visual del partido -->
            <div
              class="rounded-xl border border-notion-border bg-notion-bg px-4 py-4"
            >
              <p
                class="text-[10px] font-semibold uppercase tracking-wider text-notion-muted mb-3 text-center"
              >
                Resultado del partido
              </p>
              <div class="flex items-center gap-3">
                <!-- Equipo local marcador -->
                <div class="flex-1 text-center">
                  <img
                    v-if="hasEquipoLogo(equipoLocalSeleccionado)"
                    :src="getEquipoLogo(equipoLocalSeleccionado)"
                    :alt="`Escudo de ${equipoLocalSeleccionado?.nombre || 'Local'}`"
                    class="mx-auto mb-1.5 w-10 h-10 rounded-full object-cover border border-notion-border bg-white"
                    @error="handleImageError(form.equipo_local_id)"
                  />
                  <div
                    v-else
                    class="mx-auto mb-1.5 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    :style="{
                      backgroundColor:
                        equipoLocalSeleccionado?.color_principal || '#164bf0',
                    }"
                  >
                    {{ equipoLocalSeleccionado?.nombre?.charAt(0) || "L" }}
                  </div>
                  <p
                    class="text-[11px] text-notion-muted truncate max-w-[90px] mx-auto"
                  >
                    {{ equipoLocalSeleccionado?.nombre || "Local" }}
                  </p>
                </div>
                <!-- Marcador -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <span
                    class="text-2xl font-bold text-notion-text tabular-nums w-8 text-center"
                    >{{ form.goles_local }}</span
                  >
                  <span class="text-notion-muted font-light text-lg">—</span>
                  <span
                    class="text-2xl font-bold text-notion-text tabular-nums w-8 text-center"
                    >{{ form.goles_visitante }}</span
                  >
                </div>
                <!-- Equipo visitante marcador -->
                <div class="flex-1 text-center">
                  <img
                    v-if="hasEquipoLogo(equipoVisitanteSeleccionado)"
                    :src="getEquipoLogo(equipoVisitanteSeleccionado)"
                    :alt="`Escudo de ${equipoVisitanteSeleccionado?.nombre || 'Visitante'}`"
                    class="mx-auto mb-1.5 w-10 h-10 rounded-full object-cover border border-notion-border bg-white"
                    @error="handleImageError(form.equipo_visitante_id)"
                  />
                  <div
                    v-else
                    class="mx-auto mb-1.5 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    :style="{
                      backgroundColor:
                        equipoVisitanteSeleccionado?.color_principal || '#6b7280',
                    }"
                  >
                    {{ equipoVisitanteSeleccionado?.nombre?.charAt(0) || "V" }}
                  </div>
                  <p
                    class="text-[11px] text-notion-muted truncate max-w-[90px] mx-auto"
                  >
                    {{ equipoVisitanteSeleccionado?.nombre || "Visitante" }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Partido programado (opcional) -->
            <div>
              <label class="block text-xs font-medium text-notion-text mb-1.5">
                Partido programado (opcional)
              </label>
              <select
                v-model="selectedScheduledMatch"
                class="input text-sm"
              >
                <option :value="null">Nuevo partido (sin programa)</option>
                <option
                  v-for="match in scheduledMatches"
                  :key="match.id"
                  :value="match.id"
                >
                  {{ match.equipo_local?.nombre }} vs {{ match.equipo_visitante?.nombre }} -
                  {{ new Date(match.fecha).toLocaleDateString() }}
                </option>
              </select>
            </div>

            <!-- Formulario -->
            <form @submit.prevent="handleSave" class="space-y-5">
              <!-- Equipo local -->
              <div>
                <label
                  class="block text-xs font-medium text-notion-text mb-1.5"
                >
                  Equipo local
                </label>
                <select
                  v-model="form.equipo_local_id"
                  class="input text-sm"
                  required
                >
                  <option value="" disabled>Selecciona el equipo local…</option>
                  <option
                    v-for="equipo in equipos"
                    :key="equipo.id"
                    :value="equipo.id"
                  >
                    {{ equipo.nombre }}
                  </option>
                </select>
              </div>

              <!-- Equipo visitante -->
              <div>
                <label
                  class="block text-xs font-medium text-notion-text mb-1.5"
                >
                  Equipo visitante
                </label>
                <select
                  v-model="form.equipo_visitante_id"
                  class="input text-sm"
                  required
                >
                  <option value="" disabled>
                    Selecciona el equipo visitante…
                  </option>
                  <option
                    v-for="equipo in equiposVisitante"
                    :key="equipo.id"
                    :value="equipo.id"
                  >
                    {{ equipo.nombre }}
                  </option>
                </select>
              </div>

              <!-- Goles -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-xs font-medium text-notion-text mb-1.5"
                  >
                    Goles local
                  </label>
                  <input
                    v-model.number="form.goles_local"
                    type="number"
                    min="0"
                    max="99"
                    class="input text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-notion-text mb-1.5"
                  >
                    Goles visitante
                  </label>
                  <input
                    v-model.number="form.goles_visitante"
                    type="number"
                    min="0"
                    max="99"
                    class="input text-sm"
                    required
                  />
                </div>
              </div>

              <!-- Fecha -->
              <div>
                <label
                  class="block text-xs font-medium text-notion-text mb-1.5"
                >
                  Fecha del partido
                </label>
                <input
                  v-model="form.fecha"
                  type="date"
                  class="input text-sm"
                  required
                />
              </div>

              <!-- Horarios -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-xs font-medium text-notion-text mb-1.5"
                  >
                    Hora inicio
                  </label>
                  <input
                    v-model="form.hora_inicio"
                    type="time"
                    class="input text-sm"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-notion-text mb-1.5"
                  >
                    Hora fin
                  </label>
                  <input
                    v-model="form.hora_fin"
                    type="time"
                    class="input text-sm"
                  />
                </div>
              </div>

              <!-- Lugar -->
              <div class="relative">
                <label
                  class="block text-xs font-medium text-notion-text mb-1.5"
                >
                  Ubicación
                </label>
                <div class="flex space-x-2 mb-2">
                  <input
                    v-model="form.lugar"
                    type="text"
                    required
                    placeholder="Polideportivo Municipal"
                    class="input text-sm flex-1"
                    @keydown.enter.prevent="updateMap"
                  />
                  <button
                    type="button"
                    @click="updateMap"
                    class="btn-primary flex-shrink-0 text-sm whitespace-nowrap px-3 py-1.5"
                  >
                    Buscar
                  </button>
                </div>

                <div
                  v-if="selectedMapUrl"
                  class="w-full h-36 rounded-lg overflow-hidden border border-notion-border mt-2"
                >
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

              <!-- Estadísticas Equipo Local -->
              <div class="border-t border-notion-border pt-4">
                <h4 class="text-xs font-semibold text-notion-text mb-3">
                  Estadísticas - Equipo Local
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="(stat, idx) in statsLocal"
                    :key="idx"
                    class="flex gap-2 items-end"
                  >
                    <select
                      v-model="stat.jugador_id"
                      class="input text-xs flex-1"
                    >
                      <option :value="null">Selecciona jugador…</option>
                      <option
                        v-for="jug in jugadoresLocal"
                        :key="jug.id"
                        :value="jug.id"
                      >
                        {{ jug.nombre }}
                      </option>
                    </select>
                    <input
                      v-model.number="stat.goles"
                      type="number"
                      min="0"
                      placeholder="G"
                      class="input text-xs w-12"
                    />
                    <input
                      v-model.number="stat.asistencias"
                      type="number"
                      min="0"
                      placeholder="A"
                      class="input text-xs w-12"
                    />
                    <input
                      v-model.number="stat.tarjetas_amarillas"
                      type="number"
                      min="0"
                      placeholder="A"
                      class="input text-xs w-12"
                    />
                    <input
                      v-model.number="stat.tarjetas_rojas"
                      type="number"
                      min="0"
                      placeholder="R"
                      class="input text-xs w-12"
                    />
                    <button
                      type="button"
                      @click="statsLocal.splice(idx, 1)"
                      class="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  @click="statsLocal.push({ jugador_id: null, goles: 0, asistencias: 0, tarjetas_amarillas: 0, tarjetas_rojas: 0 })"
                  class="mt-2 text-xs text-primary hover:underline"
                >
                  + Agregar jugador
                </button>
              </div>

              <!-- Estadísticas Equipo Visitante -->
              <div class="border-t border-notion-border pt-4">
                <h4 class="text-xs font-semibold text-notion-text mb-3">
                  Estadísticas - Equipo Visitante
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="(stat, idx) in statsVisitante"
                    :key="idx"
                    class="flex gap-2 items-end"
                  >
                    <select
                      v-model="stat.jugador_id"
                      class="input text-xs flex-1"
                    >
                      <option :value="null">Selecciona jugador…</option>
                      <option
                        v-for="jug in jugadoresVisitante"
                        :key="jug.id"
                        :value="jug.id"
                      >
                        {{ jug.nombre }}
                      </option>
                    </select>
                    <input
                      v-model.number="stat.goles"
                      type="number"
                      min="0"
                      placeholder="G"
                      class="input text-xs w-12"
                    />
                    <input
                      v-model.number="stat.asistencias"
                      type="number"
                      min="0"
                      placeholder="A"
                      class="input text-xs w-12"
                    />
                    <input
                      v-model.number="stat.tarjetas_amarillas"
                      type="number"
                      min="0"
                      placeholder="A"
                      class="input text-xs w-12"
                    />
                    <input
                      v-model.number="stat.tarjetas_rojas"
                      type="number"
                      min="0"
                      placeholder="R"
                      class="input text-xs w-12"
                    />
                    <button
                      type="button"
                      @click="statsVisitante.splice(idx, 1)"
                      class="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  @click="statsVisitante.push({ jugador_id: null, goles: 0, asistencias: 0, tarjetas_amarillas: 0, tarjetas_rojas: 0 })"
                  class="mt-2 text-xs text-primary hover:underline"
                >
                  + Agregar jugador
                </button>
              </div>

              <!-- Observaciones -->
              <div class="border-t border-notion-border pt-4">
                <label
                  class="block text-xs font-medium text-notion-text mb-1.5"
                >
                  Incidencias / Observaciones
                </label>
                <textarea
                  v-model="form.observaciones"
                  placeholder="Retrasos, lesiones, conflictos, etc."
                  class="input text-sm"
                  rows="3"
                ></textarea>
              </div>

              <!-- Árbitro -->
              <div>
                <label
                  class="block text-xs font-medium text-notion-text mb-1.5"
                >
                  Árbitro <span class="text-notion-muted">(opcional)</span>
                </label>
                <input
                  v-model="form.arbitro"
                  type="text"
                  placeholder="Nombre del árbitro"
                  class="input text-sm"
                />
              </div>

              <!-- Redactado por -->
              <div>
                <label
                  class="block text-xs font-medium text-notion-text mb-1.5"
                >
                  Nombre de quien redacta el acta
                </label>
                <input
                  v-model="form.redactado_por"
                  type="text"
                  placeholder="Tu nombre"
                  class="input text-sm"
                  required
                />
              </div>

              <!-- Confirmación -->
              <div class="flex items-start gap-2 border-t border-notion-border pt-4">
                <input
                  v-model="form.confirmado"
                  type="checkbox"
                  id="confirmar"
                  class="mt-1"
                />
                <label
                  for="confirmar"
                  class="text-xs text-notion-text cursor-pointer"
                >
                  Confirmo que toda la información es correcta
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
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                Resultado guardado. Clasificación actualizada.
              </div>

              <!-- Botones -->
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="btn-outline flex-1 text-sm"
                  @click="closePanel"
                  :disabled="saving"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                  :disabled="saving || !form.confirmado"
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
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {{ saving ? "Guardando…" : "Guardar resultado" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Backdrop fade */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* Slide-over from right */
.slideover-enter-active,
.slideover-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slideover-enter-from,
.slideover-leave-to {
  transform: translateX(100%);
}
</style>
