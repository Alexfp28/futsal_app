<script setup>
import { ref } from "vue";
import { supabase } from "@/lib/supabase";

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

const fetchSection = async (sectionId) => {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return;

  if (data.value[section.id]?.length) {
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
  </div>
</template>
