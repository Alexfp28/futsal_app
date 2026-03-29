<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import { UserGroupIcon, TrophyIcon } from "@heroicons/vue/24/outline";

const equipos = ref([]);
const loading = ref(true);
const error = ref(null);
const imageErrors = ref({});

// Función para obtener la ruta del escudo
const getEquipoLogo = (equipo) => equipo?.logo_url || equipo?.escudo_url || null;

// Función para manejar error de imagen
const hasEquipoLogo = (equipo) =>
  Boolean(getEquipoLogo(equipo)) && !imageErrors.value[equipo.id];

const handleImageError = (equipoId) => {
  imageErrors.value = {
    ...imageErrors.value,
    [equipoId]: true,
  };
};

const loadEquipos = async () => {
  loading.value = true;
  error.value = null;
  imageErrors.value = {};
  try {
    const { data, err } = await supabase
      .from("equipos")
      .select(
        `
        *,
        capitan:profiles!equipos_capitan_id_fkey(nombre),
        jugadores:profiles!profiles_equipo_id_fkey(id)
      `,
      )
      .order("nombre");

    if (err) throw err;
    equipos.value = data || [];
  } catch (e) {
    error.value = "Error al cargar los equipos";
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadEquipos();
});

// Recargar datos cuando se navega a esta ruta
useRouteRefresh(loadEquipos);

// Datos de ejemplo para mostrar cuando no hay conexión a Supabase
const equiposEjemplo = [
  {
    id: 1,
    nombre: "Los Tigres",
    color_principal: "#164bf0",
    color_secundario: "#f6ec15",
    capitan: { nombre: "Carlos García" },
    jugadores_count: 8,
  },
  {
    id: 2,
    nombre: "Águilas FC",
    color_principal: "#dc2626",
    color_secundario: "#ffffff",
    capitan: { nombre: "Miguel Torres" },
    jugadores_count: 7,
  },
  {
    id: 3,
    nombre: "La Vall United",
    color_principal: "#16a34a",
    color_secundario: "#000000",
    capitan: { nombre: "Pedro Martínez" },
    jugadores_count: 9,
  },
  {
    id: 4,
    nombre: "Deportivo Juventud",
    color_principal: "#7c3aed",
    color_secundario: "#fbbf24",
    capitan: { nombre: "Juan López" },
    jugadores_count: 6,
  },
  {
    id: 5,
    nombre: "CF San José",
    color_principal: "#0ea5e9",
    color_secundario: "#1e3a5f",
    capitan: { nombre: "Luis Fernández" },
    jugadores_count: 8,
  },
  {
    id: 6,
    nombre: "Atlético Vall",
    color_principal: "#f97316",
    color_secundario: "#1f2937",
    capitan: { nombre: "Andrés Ruiz" },
    jugadores_count: 7,
  },
];
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Equipos Inscritos</h1>
      <p class="page-subtitle">
        Conoce a todos los equipos que forman parte de FutSal La Vall
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <p class="text-notion-muted text-sm">Mostrando datos de ejemplo:</p>
    </div>

    <!-- Equipos Grid -->
    <div
      v-if="!loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <div
        v-for="equipo in equipos.length > 0 ? equipos : equiposEjemplo"
        :key="equipo.id"
        class="card overflow-hidden group hover:shadow-lg transition-all duration-300 hover:cursor-pointer"
      >
        <!-- Área del escudo con color de fondo -->
        <div
          class="relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden"
          :style="{
            background: `linear-gradient(135deg, ${equipo.color_principal || '#164bf0'}20, ${equipo.color_secundario || '#f6ec15'}20)`,
          }"
        >
          <!-- Imagen del escudo -->
          <img
            v-if="hasEquipoLogo(equipo)"
            :src="getEquipoLogo(equipo)"
            :alt="`Escudo de ${equipo.nombre}`"
            class="w-24 h-24 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
            @error="handleImageError(equipo.id)"
          />
          <!-- Placeholder si no hay imagen -->
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center"
          >
            <div
              class="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg"
              :style="{ backgroundColor: equipo.color_principal || '#164bf0' }"
            >
              {{ equipo.nombre.charAt(0) }}
            </div>
          </div>

          <!-- Badge de número de jugadores -->
          <div
            class="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md"
          >
            <span class="text-sm font-bold text-primary">
              {{
                equipo.jugadores_count ?? equipo.jugadores?.length ?? 0
              }}
              jugadores
            </span>
          </div>
        </div>

        <!-- Información del equipo - Área dedicada con fondo opaco -->
        <div class="p-5 bg-white">
          <!-- Nombre del equipo -->
          <h3
            class="font-semibold text-lg text-notion-text mb-3 group-hover:text-primary transition-colors truncate"
          >
            {{ equipo.nombre }}
          </h3>

          <!-- Capitán -->
          <div class="flex items-center text-sm text-notion-muted mb-4">
            <UserGroupIcon class="w-4 h-4 mr-2 flex-shrink-0" />
            <span class="truncate">
              Capitán:
              {{
                equipo.capitan?.nombre || "Sin asignar"
              }}
            </span>
          </div>

          <!-- Colores del equipo -->
          <div
            class="flex items-center gap-3 pt-3 border-t border-notion-border"
          >
            <span class="text-xs text-notion-muted">Colores:</span>
            <div class="flex items-center gap-2">
              <div
                class="w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                :style="{
                  backgroundColor: equipo.color_principal || '#164bf0',
                }"
                :title="'Color principal'"
              ></div>
              <div
                class="w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                :style="{
                  backgroundColor: equipo.color_secundario || '#f6ec15',
                }"
                :title="'Color secundario'"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && equipos.length === 0 && equiposEjemplo.length === 0"
      class="text-center py-12"
    >
      <TrophyIcon class="w-16 h-16 text-notion-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-notion-text mb-2">
        No hay equipos registrados
      </h3>
      <p class="text-notion-muted">Sé el primero en crear un equipo</p>
      <router-link to="/registro" class="btn-primary mt-4 inline-block">
        Registrarme
      </router-link>
    </div>
  </div>
</template>
