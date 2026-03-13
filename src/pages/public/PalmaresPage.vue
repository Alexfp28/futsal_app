<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  PlusIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const canManage = authStore.isAdmin;

const temporadas = ref([]);
const loading = ref(true);
const showPanel = ref(false);
const saving = ref(false);

// Formulario para nueva temporada
const form = ref({
  nombre: "",
  año_inicio: "",
  año_fin: "",
});

// Cargar temporadas con campeones y goleadores
onMounted(async () => {
  try {
    // Cargar temporadas
    const { data: tempData } = await supabase
      .from("temporadas")
      .select("*")
      .order("año_inicio", { ascending: false });

    if (tempData) {
      // Cargar campeones y goleadores para cada temporada
      for (const temp of tempData) {
        const { data: campeones } = await supabase
          .from("temporadas_campeones")
          .select("*, equipo:equipos(nombre, escudo_url)")
          .eq("temporada_id", temp.id)
          .single();

        const { data: goleadores } = await supabase
          .from("temporadas_goleadores")
          .select("*, jugador:profiles(nombre)")
          .eq("temporada_id", temp.id)
          .single();

        temp.campeon = campeones?.equipo || null;
        temp.max_goleador = goleadores?.jugador || null;
        temp.goles = goleadores?.goles || 0;
      }

      temporadas.value = tempData;
    }
  } catch (e) {
    console.error("Error cargando palmares:", e);
  } finally {
    loading.value = false;
  }
});

// Datos de ejemplo
const temporadasEjemplo = [
  {
    id: "ejemplo-1",
    nombre: "Temporada 2024-2025",
    año_inicio: 2024,
    año_fin: 2025,
    activa: false,
    campeon: { nombre: "Los Tigres", escudo_url: null },
    max_goleador: { nombre: "Carlos Ruiz" },
    goles: 28,
  },
  {
    id: "ejemplo-2",
    nombre: "Temporada 2023-2024",
    año_inicio: 2023,
    año_fin: 2024,
    activa: false,
    campeon: { nombre: "Águilas FC", escudo_url: null },
    max_goleador: { nombre: "Alejandro Sánchez" },
    goles: 32,
  },
];

const openPanel = () => {
  form.value = {
    nombre: "",
    año_inicio: new Date().getFullYear(),
    año_fin: new Date().getFullYear() + 1,
  };
  showPanel.value = true;
};

const closePanel = () => {
  showPanel.value = false;
};

const handleSave = async () => {
  if (!form.value.nombre || !form.value.año_inicio || !form.value.año_fin) {
    return;
  }

  saving.value = true;
  try {
    const { error } = await supabase.from("temporadas").insert({
      nombre: form.value.nombre,
      año_inicio: Number(form.value.año_inicio),
      año_fin: Number(form.value.año_fin),
      activa: false,
    });

    if (error) throw error;
    closePanel();
    // Recargar
    window.location.reload();
  } catch (e) {
    console.error("Error guardando temporada:", e);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Palmarés Histórico</h1>
      <p class="page-subtitle">
        Los campeones y máximos goleadores de cada temporada
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <!-- Lista de temporadas -->
      <div class="space-y-6">
        <div
          v-for="temp in temporadas.length > 0 ? temporadas : temporadasEjemplo"
          :key="temp.id"
          class="card p-6"
        >
          <!-- Header de temporada -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  temp.activa ? 'bg-green-500' : 'bg-primary/10',
                ]"
              >
                <CalendarIcon
                  :class="[
                    'w-6 h-6',
                    temp.activa ? 'text-white' : 'text-primary',
                  ]"
                />
              </div>
              <div>
                <h2 class="text-xl font-bold text-notion-text">
                  {{ temp.nombre }}
                </h2>
                <p
                  v-if="temp.activa"
                  class="text-sm text-green-600 font-medium"
                >
                  🏃 Temporada en curso
                </p>
                <p v-else class="text-sm text-notion-muted">
                  {{ temp.año_inicio }} - {{ temp.año_fin }}
                </p>
              </div>
            </div>
          </div>

          <!-- Estadísticas -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Campeón -->
            <div class="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div class="flex items-center gap-2 mb-2">
                <TrophyIcon class="w-5 h-5 text-yellow-600" />
                <span class="font-semibold text-yellow-800">Campeón</span>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold text-lg"
                >
                  🏆
                </div>
                <div>
                  <p class="font-bold text-notion-text">
                    {{ temp.campeon?.nombre || "Por determinar" }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Máximo Goleador -->
            <div class="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div class="flex items-center gap-2 mb-2">
                <StarIcon class="w-5 h-5 text-blue-600" />
                <span class="font-semibold text-blue-800">Máximo Goleador</span>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-lg"
                >
                  ⚽
                </div>
                <div>
                  <p class="font-bold text-notion-text">
                    {{ temp.max_goleador?.nombre || "Por determinar" }}
                  </p>
                  <p v-if="temp.goles" class="text-sm text-notion-muted">
                    {{ temp.goles }} goles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state si no hay datos -->
      <div
        v-if="temporadas.length === 0"
        class="text-center py-12 text-notion-muted"
      >
        <TrophyIcon class="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>No hay temporadas registradas todavía</p>
      </div>
    </template>

    <!-- Panel para admins (modal simple) -->
    <Teleport to="body">
      <div
        v-if="showPanel"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closePanel"
      >
        <div class="fixed inset-0 bg-black/50" @click="closePanel"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl"
          >
            <h3 class="text-lg font-bold text-notion-text mb-4">
              Nueva Temporada
            </h3>
            <form @submit.prevent="handleSave" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-notion-text mb-1">
                  Nombre
                </label>
                <input
                  v-model="form.nombre"
                  type="text"
                  class="input w-full"
                  placeholder="Temporada 2025-2026"
                  required
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-sm font-medium text-notion-text mb-1"
                  >
                    Año inicio
                  </label>
                  <input
                    v-model="form.año_inicio"
                    type="number"
                    class="input w-full"
                    required
                  />
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-notion-text mb-1"
                  >
                    Año fin
                  </label>
                  <input
                    v-model="form.año_fin"
                    type="number"
                    class="input w-full"
                    required
                  />
                </div>
              </div>
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="btn-outline flex-1"
                  @click="closePanel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn-primary flex-1"
                  :disabled="saving"
                >
                  {{ saving ? "Guardando..." : "Crear" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
