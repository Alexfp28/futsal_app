<script setup>
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  TrophyIcon,
  UserGroupIcon,
  StarIcon,
  FireIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();

// Props opcionales para personalización cuando se usa dentro de la intranet
const props = defineProps({
  customTitle: {
    type: String,
    default: "",
  },
  customSubtitle: {
    type: String,
    default: "",
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
});

// Determinar qué título mostrar
const pageTitle = computed(() => props.customTitle || "Rankings");
const pageSubtitle = computed(
  () => props.customSubtitle || "Los mejores jugadores de la temporada",
);

const sections = [
  {
    id: "goles",
    label: "Goleadores",
    icon: TrophyIcon,
    view: "ranking_goles",
    valueKey: "goles",
    color: "text-yellow-500",
  },
  {
    id: "asistencias",
    label: "Asistencias",
    icon: UserGroupIcon,
    view: "ranking_asistencias",
    valueKey: "asistencias",
    color: "text-blue-500",
  },
  {
    id: "porteros",
    label: "Porteros",
    icon: "",
    view: "ranking_porteros",
    valueKey: "paradas",
    color: "text-green-500",
  },
  {
    id: "sanciones",
    label: "Sanciones",
    icon: FireIcon,
    view: "ranking_sanciones",
    valueKey: "total_sanciones",
    color: "text-red-500",
  },
  {
    id: "mvp",
    label: "MVP",
    icon: StarIcon,
    view: "ranking_mvp",
    valueKey: "media_valoracion",
    color: "text-purple-500",
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
    error.value = "No se pudieron cargar los rankings en este momento.";
  } finally {
    loading.value = false;
  }
};

// Cargar por defecto la sección de goles
fetchSection("goles");

const formatValue = (sectionId, row) => {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return "";

  const value = row[section.valueKey];

  if (sectionId === "mvp" && value != null) {
    return `${Number(value).toFixed(2)} / 10`;
  }

  if (sectionId === "sanciones") {
    return value;
  }

  return value ?? 0;
};

const getMedals = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
};
</script>

<template>
  <div class="page-container">
    <div v-if="!hideHeader" class="mb-8">
      <h1 class="page-title">{{ pageTitle }}</h1>
      <p class="page-subtitle">{{ pageSubtitle }}</p>
    </div>

    <!-- Selector de sección -->
    <div class="flex flex-wrap gap-2 mb-8">
      <button
        v-for="section in sections"
        :key="section.id"
        @click="fetchSection(section.id)"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
          activeSection === section.id
            ? 'bg-primary text-white'
            : 'bg-white border border-notion-border text-notion-muted hover:bg-notion-bg',
        ]"
      >
        <component
          :is="section.icon"
          class="w-5 h-5"
          :class="activeSection === section.id ? 'text-white' : section.color"
        />
        {{ section.label }}
      </button>
    </div>

    <!-- Contenido -->
    <div class="card p-6">
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
        ></div>
      </div>

      <div
        v-else-if="error"
        class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
      >
        {{ error }}
      </div>

      <template v-else>
        <div
          v-if="!data[activeSection] || data[activeSection].length === 0"
          class="text-center py-12"
        >
          <TrophyIcon
            class="w-16 h-16 text-notion-muted mx-auto mb-4 opacity-50"
          />
          <p class="text-notion-muted">
            No hay datos disponibles para este ranking
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(row, index) in data[activeSection]"
            :key="row.jugador_id || index"
            class="flex items-center justify-between p-4 rounded-xl hover:bg-notion-bg transition-colors"
            :class="{
              'bg-yellow-50 border border-yellow-200': index === 0,
              'bg-gray-50 border border-gray-200': index === 1,
              'bg-orange-50 border border-orange-200': index === 2,
            }"
          >
            <div class="flex items-center gap-4">
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold',
                  index === 0
                    ? 'bg-yellow-400 text-yellow-900'
                    : index === 1
                      ? 'bg-gray-300 text-gray-700'
                      : index === 2
                        ? 'bg-orange-300 text-orange-900'
                        : 'bg-notion-bg text-notion-muted',
                ]"
              >
                {{ index + 1 }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-notion-text">
                    {{ row.nombre }}
                  </h3>
                  <span class="text-xl">{{ getMedals(index) }}</span>
                </div>
                <p class="text-sm text-notion-muted">
                  {{ row.equipo_nombre || "Sin equipo" }}
                </p>
              </div>
            </div>

            <div class="text-right">
              <p class="text-xl font-bold text-primary">
                {{ formatValue(activeSection, row) }}
              </p>
              <p
                v-if="activeSection === 'sanciones'"
                class="text-xs text-notion-muted"
              >
                {{ row.amarillas || 0 }}🟨 / {{ row.rojas || 0 }}🟥
              </p>
              <p
                v-else-if="activeSection === 'mvp'"
                class="text-xs text-notion-muted"
              >
                {{ row.partidos_valorados || 0 }} partidos valorados
              </p>
              <p
                v-else-if="activeSection === 'goles'"
                class="text-xs text-notion-muted"
              >
                goles
              </p>
              <p
                v-else-if="activeSection === 'asistencias'"
                class="text-xs text-notion-muted"
              >
                asistencias
              </p>
              <p
                v-else-if="activeSection === 'porteros'"
                class="text-xs text-notion-muted"
              >
                paradas
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
