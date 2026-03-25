<script setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  CalendarDaysIcon,
  ListBulletIcon,
} from "@heroicons/vue/24/outline";
import RegistroResultadoPanel from "./RegistroResultadoPanel.vue";

const authStore = useAuthStore();
const canManage = computed(() => authStore.isAdmin);

const loading = ref(true);
const error = ref("");
const rows = ref([]);
const showLegend = ref(false);
const viewMode = ref("tabla"); // 'tabla' | 'tarjetas'

// Panel state
const showPanel = ref(false);

// Image errors (for tabla/tarjetas views)
const imageErrors = ref({});
const openPanel = () => {
  showPanel.value = true;
};

const closePanel = () => {
  showPanel.value = false;
};

const onResultadoSaved = async () => {
  await fetchClasificacion();
};

// Helper functions for displaying team logos
const getEquipoLogo = (equipo) => equipo?.logo_url || equipo?.escudo_url || null;

const hasEquipoLogo = (equipo) =>
  Boolean(getEquipoLogo(equipo)) && !imageErrors.value[equipo?.id];

const handleImageError = (equipoId) => {
  imageErrors.value = {
    ...imageErrors.value,
    [equipoId]: true,
  };
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

    <!-- ── Registro Resultado Panel ──────────────────────────────────────── -->
    <RegistroResultadoPanel
      :show="showPanel"
      @close="closePanel"
      @resultado-saved="onResultadoSaved"
    />
  </div>
</template>
