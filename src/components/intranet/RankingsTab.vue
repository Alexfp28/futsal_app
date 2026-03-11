<script setup>
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const canManage = computed(() => authStore.isAdmin);

const showPanel = ref(false);
const saving = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);

const form = ref({
  partido_id: "",
  jugador_id: "",
  goles: 0,
  asistencias: 0,
  tarjetas_amarillas: 0,
  tarjetas_rojas: 0,
  paradas_portero: 0,
  valoracion_mvp: null,
});

const partidos = ref([]);
const jugadores = ref([]);

const fetchFormData = async () => {
  const { data: eData } = await supabase.from("equipos").select("id, nombre");
  const eMap = {};
  if (eData) {
    eData.forEach((e) => {
      eMap[e.id] = e.nombre;
    });
  }

  const { data: pData } = await supabase
    .from("partidos")
    .select("id, equipo_local_id, equipo_visitante_id, fecha")
    .order("fecha", { ascending: false });

  if (pData) {
    partidos.value = pData.map((p) => ({
      ...p,
      nombre_mostrar: `${new Date(p.fecha).toLocaleDateString()} - ${
        eMap[p.equipo_local_id] || "Local"
      } vs ${eMap[p.equipo_visitante_id] || "Visitante"}`,
    }));
  }

  const { data: jData } = await supabase
    .from("profiles")
    .select("id, nombre, equipo_id")
    .order("nombre");

  if (jData) {
    jugadores.value = jData.map((j) => ({
      ...j,
      nombre_mostrar: `${j.nombre} (${eMap[j.equipo_id] || "Sin equipo"})`,
    }));
  }
};

const openPanel = async () => {
  saveError.value = "";
  saveSuccess.value = false;
  form.value = {
    partido_id: "",
    jugador_id: "",
    goles: 0,
    asistencias: 0,
    tarjetas_amarillas: 0,
    tarjetas_rojas: 0,
    paradas_portero: 0,
    valoracion_mvp: null,
  };
  if (partidos.value.length === 0 || jugadores.value.length === 0) {
    await fetchFormData();
  }
  showPanel.value = true;
};

const closePanel = () => {
  showPanel.value = false;
};

const handleSave = async () => {
  saveError.value = "";
  saveSuccess.value = false;

  if (!form.value.partido_id || !form.value.jugador_id) {
    saveError.value = "Selecciona partido y jugador.";
    return;
  }

  saving.value = true;
  try {
    const payload = {
      partido_id: form.value.partido_id,
      jugador_id: form.value.jugador_id,
      goles: Number(form.value.goles) || 0,
      asistencias: Number(form.value.asistencias) || 0,
      tarjetas_amarillas: Number(form.value.tarjetas_amarillas) || 0,
      tarjetas_rojas: Number(form.value.tarjetas_rojas) || 0,
      paradas_portero: Number(form.value.paradas_portero) || 0,
    };

    if (form.value.valoracion_mvp && form.value.valoracion_mvp > 0) {
      payload.valoracion_mvp = Number(form.value.valoracion_mvp);
    } else {
      payload.valoracion_mvp = null;
    }

    const { error: insertError } = await supabase
      .from("estadisticas_partido_jugador")
      .upsert(payload, { onConflict: "partido_id,jugador_id" });

    if (insertError) throw insertError;

    saveSuccess.value = true;
    await fetchSection(activeSection.value, true);

    setTimeout(() => {
      saveSuccess.value = false;
      closePanel();
    }, 1800);
  } catch (e) {
    console.error("Error guardando estadística:", e);
    saveError.value = "No se pudo guardar el dato. Inténtalo de nuevo.";
  } finally {
    saving.value = false;
  }
};

const sections = [
  { id: "goles", label: "Goles", view: "ranking_goles", valueKey: "goles" },
  {
    id: "asistencias",
    label: "Asistencias",
    view: "ranking_asistencias",
    valueKey: "asistencias",
  },
  {
    id: "sanciones",
    label: "Sanciones",
    view: "ranking_sanciones",
    valueKey: "total_sanciones",
  },
  {
    id: "porteros",
    label: "Porteros",
    view: "ranking_porteros",
    valueKey: "paradas",
  },
  {
    id: "mvp",
    label: "Mejores jugadores",
    view: "ranking_mvp",
    valueKey: "media_valoracion",
  },
];

const activeSection = ref("goles");
const loading = ref(false);
const error = ref("");
const data = ref({});

const fetchSection = async (sectionId, force = false) => {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return;

  if (!force && data.value[section.id]?.length) {
    activeSection.value = section.id;
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const { data: rows, error: supabaseError } = await supabase
      .from(section.view)
      .select("*")
      .limit(50);

    if (supabaseError) throw supabaseError;
    data.value = {
      ...data.value,
      [section.id]: rows || [],
    };
    activeSection.value = section.id;
  } catch (e) {
    console.error("Error cargando ranking:", e);
    error.value =
      "No se pudieron cargar los rankings en este momento. Inténtalo de nuevo más tarde.";
  } finally {
    loading.value = false;
  }
};

// cargar por defecto la sección de goles
fetchSection("goles");

const formatValue = (sectionId, row) => {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return "";

  const value = row[section.valueKey];

  if (sectionId === "mvp" && value != null) {
    return `${Number(value).toFixed(2)} / 10`;
  }

  return value ?? 0;
};
</script>

<template>
  <div class="space-y-4">
    <!-- Encabezado con botones -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <!-- Selector de sección -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          @click="fetchSection(section.id)"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
            activeSection === section.id
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-notion-text border-notion-border hover:bg-notion-bg',
          ]"
        >
          {{ section.label }}
        </button>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Botón registrar dato (solo admin) -->
        <button
          v-if="canManage"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-600 transition-colors shadow-sm"
          @click="openPanel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Introducir dato
        </button>
      </div>
    </div>

    <!-- Contenido -->
    <div class="card p-4 sm:p-5">
      <div v-if="loading" class="flex justify-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        ></div>
      </div>

      <div
        v-else-if="error"
        class="p-4 mb-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
      >
        {{ error }}
      </div>

      <template v-else>
        <div
          v-if="!data[activeSection] || data[activeSection].length === 0"
          class="py-6 text-sm text-notion-muted text-center"
        >
          Todavía no hay datos registrados para este ranking.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(row, index) in data[activeSection]"
            :key="row.jugador_id || index"
            class="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-notion-bg transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-7 h-7 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center"
              >
                {{ index + 1 }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-notion-text truncate">
                  {{ row.nombre }}
                </p>
                <p class="text-[11px] sm:text-xs text-notion-muted truncate">
                  {{ row.equipo_nombre || "Sin equipo" }}
                </p>
              </div>
            </div>

            <div class="text-right">
              <p class="text-sm font-semibold text-notion-text">
                {{ formatValue(activeSection, row) }}
              </p>
              <p
                v-if="activeSection === 'sanciones'"
                class="text-[11px] text-notion-muted"
              >
                {{ row.amarillas || 0 }}A / {{ row.rojas || 0 }}R
              </p>
              <p
                v-else-if="activeSection === 'mvp'"
                class="text-[11px] text-notion-muted"
              >
                {{ row.partidos_valorados || 0 }} partidos valorados
              </p>
            </div>
          </div>
        </div>
      </template>
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
          class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
          @click.stop
        >
          <!-- Header del panel -->
          <div class="flex items-center justify-between border-b border-notion-border px-6 py-4">
            <div>
              <h2 class="text-base font-semibold text-notion-text">
                Registrar dato de ranking
              </h2>
              <p class="text-xs text-notion-muted mt-0.5">
                Selecciona partido y jugador para actualizar estadísticas.
              </p>
            </div>
            <button
              type="button"
              class="rounded-full p-1.5 text-notion-muted hover:bg-notion-bg hover:text-notion-text transition-colors"
              @click="closePanel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Cuerpo del formulario -->
          <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <form @submit.prevent="handleSave" class="space-y-5">
              
              <!-- Partido -->
              <div>
                <label class="block text-xs font-medium text-notion-text mb-1.5">
                  Partido
                </label>
                <select v-model="form.partido_id" class="input text-sm w-full" required>
                  <option value="" disabled>Selecciona el partido…</option>
                  <option v-for="partido in partidos" :key="partido.id" :value="partido.id">
                    {{ partido.nombre_mostrar }}
                  </option>
                </select>
              </div>

              <!-- Jugador -->
              <div>
                <label class="block text-xs font-medium text-notion-text mb-1.5">
                  Jugador
                </label>
                <select v-model="form.jugador_id" class="input text-sm w-full" required>
                  <option value="" disabled>Selecciona el jugador…</option>
                  <option v-for="jugador in jugadores" :key="jugador.id" :value="jugador.id">
                    {{ jugador.nombre_mostrar }}
                  </option>
                </select>
              </div>

              <!-- Goles y Asistencias -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-notion-text mb-1.5">Goles</label>
                  <input v-model.number="form.goles" type="number" min="0" class="input text-sm w-full" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-notion-text mb-1.5">Asistencias</label>
                  <input v-model.number="form.asistencias" type="number" min="0" class="input text-sm w-full" />
                </div>
              </div>

              <!-- Tarjetas -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-notion-text mb-1.5">T. Amarillas</label>
                  <input v-model.number="form.tarjetas_amarillas" type="number" min="0" class="input text-sm w-full" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-notion-text mb-1.5">T. Rojas</label>
                  <input v-model.number="form.tarjetas_rojas" type="number" min="0" class="input text-sm w-full" />
                </div>
              </div>

              <!-- Porteros y MVP -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-notion-text mb-1.5">Paradas (Portero)</label>
                  <input v-model.number="form.paradas_portero" type="number" min="0" class="input text-sm w-full" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-notion-text mb-1.5">MVP (1-10)</label>
                  <input v-model.number="form.valoracion_mvp" type="number" min="1" max="10" class="input text-sm w-full" />
                </div>
              </div>

              <!-- Feedback de error -->
              <div
                v-if="saveError"
                class="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700 mt-2"
              >
                {{ saveError }}
              </div>

              <!-- Feedback de éxito -->
              <div
                v-if="saveSuccess"
                class="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-700 flex items-center gap-2 mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Dato guardado correctamente.
              </div>

              <!-- Botones -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  class="btn-outline flex-1 text-sm bg-white border border-notion-border text-notion-text px-4 py-2 rounded-lg font-medium hover:bg-notion-bg"
                  @click="closePanel"
                  :disabled="saving"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn-primary flex-1 text-sm flex items-center justify-center gap-2 bg-primary text-white rounded-lg px-4 py-2 font-medium hover:bg-primary-600"
                  :disabled="saving"
                >
                  <svg
                    v-if="saving"
                    class="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {{ saving ? "Guardando…" : "Guardar dato" }}
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
