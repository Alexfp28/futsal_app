<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const canManage = authStore.isAdmin;

const temporadas = ref([]);
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);
const errorMsg = ref("");
const temporadasList = ref([]);

const form = ref({
  temporada_id: "",
  tipo_competicion: "liga",
  nombre_equipo: "",
});

const labelCompeticion = {
  liga: "Liga FUTSALVALL",
  copa: "Copa FUTSALVALL",
  supercopa: "Supercopa FUTSALVALL",
};

const colorCompeticion = {
  liga: "bg-yellow-50 border-yellow-200 text-yellow-800",
  copa: "bg-blue-50 border-blue-200 text-blue-800",
  supercopa: "bg-purple-50 border-purple-200 text-purple-800",
};

const iconColorCompeticion = {
  liga: "text-yellow-600",
  copa: "text-blue-600",
  supercopa: "text-purple-600",
};

const loadPalmares = async () => {
  loading.value = true;
  try {
    const { data: tempData } = await supabase
      .from("temporadas")
      .select("*")
      .order("año_inicio", { ascending: false });

    if (tempData) {
      temporadasList.value = tempData;

      // Cargar todos los campeones en una sola query (evita N+1)
      const { data: campeones } = await supabase
        .from("temporadas_campeones")
        .select(
          "temporada_id, tipo_competicion, nombre_equipo, equipo:equipos(nombre, escudo_url)"
        );

      // Agrupar por temporada_id
      const tipoOrder = { liga: 0, copa: 1, supercopa: 2 };
      const campeonesMap = {};
      for (const c of campeones || []) {
        if (!campeonesMap[c.temporada_id]) campeonesMap[c.temporada_id] = [];
        campeonesMap[c.temporada_id].push({
          tipo: c.tipo_competicion,
          nombre: c.nombre_equipo || c.equipo?.nombre || "Por determinar",
          escudo_url: c.equipo?.escudo_url || null,
        });
      }
      for (const arr of Object.values(campeonesMap)) {
        arr.sort(
          (a, b) => (tipoOrder[a.tipo] ?? 9) - (tipoOrder[b.tipo] ?? 9)
        );
      }

      // Cargar goleadores en una sola query
      const { data: goleadores } = await supabase
        .from("temporadas_goleadores")
        .select("temporada_id, goles, jugador:profiles(nombre)");

      const goleadoresMap = {};
      for (const g of goleadores || []) {
        goleadoresMap[g.temporada_id] = {
          nombre: g.jugador?.nombre || null,
          goles: g.goles || 0,
        };
      }

      for (const temp of tempData) {
        temp.competiciones = campeonesMap[temp.id] || [];
        temp.max_goleador = goleadoresMap[temp.id]?.nombre || null;
        temp.goles = goleadoresMap[temp.id]?.goles || 0;
      }

      temporadas.value = tempData;
    }
  } catch (e) {
    console.error("Error cargando palmares:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPalmares();
});

useRouteRefresh(loadPalmares);

// Datos de ejemplo (fallback cuando no hay temporadas reales)
const temporadasEjemplo = [
  {
    id: "ejemplo-1",
    nombre: "Temporada 2024-2025",
    año_inicio: 2024,
    año_fin: 2025,
    activa: false,
    competiciones: [
      { tipo: "liga", nombre: "Los Tigres", escudo_url: null },
      { tipo: "copa", nombre: "Águilas FC", escudo_url: null },
    ],
    max_goleador: "Carlos Ruiz",
    goles: 28,
  },
];

const openModal = () => {
  form.value = { temporada_id: "", tipo_competicion: "liga", nombre_equipo: "" };
  errorMsg.value = "";
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const handleSave = async () => {
  if (!form.value.temporada_id || !form.value.nombre_equipo.trim()) {
    errorMsg.value = "La temporada y el nombre del equipo son obligatorios.";
    return;
  }
  saving.value = true;
  errorMsg.value = "";
  try {
    const { error } = await supabase.from("temporadas_campeones").insert({
      temporada_id: form.value.temporada_id,
      tipo_competicion: form.value.tipo_competicion,
      nombre_equipo: form.value.nombre_equipo.trim(),
    });
    if (error) {
      if (error.code === "23505") {
        errorMsg.value =
          "Ya existe un campeón para esa competición en esa temporada.";
      } else {
        throw error;
      }
      return;
    }
    closeModal();
    await loadPalmares();
  } catch (e) {
    console.error("Error guardando palmarés:", e);
    errorMsg.value = "Error al guardar. Inténtalo de nuevo.";
  } finally {
    saving.value = false;
  }
};

const deletePalmares = async (temporadaId, tipoCompeticion) => {
  if (!confirm("¿Eliminar este palmarés?")) return;
  try {
    const { error } = await supabase
      .from("temporadas_campeones")
      .delete()
      .eq("temporada_id", temporadaId)
      .eq("tipo_competicion", tipoCompeticion);
    if (error) throw error;
    await loadPalmares();
  } catch (e) {
    console.error("Error eliminando palmarés:", e);
  }
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h1 class="page-title">Palmarés Histórico</h1>
        <p class="page-subtitle">
          Los campeones de cada competición por temporada
        </p>
      </div>
      <button
        v-if="canManage"
        @click="openModal"
        class="btn-primary flex items-center gap-2 flex-shrink-0"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Añadir Palmarés</span>
      </button>
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
          <div class="flex items-center gap-3 mb-5">
            <div
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
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

          <!-- Competiciones -->
          <div class="space-y-3">
            <div
              v-for="comp in temp.competiciones"
              :key="comp.tipo"
              class="p-4 rounded-xl border flex items-center justify-between"
              :class="colorCompeticion[comp.tipo]"
            >
              <div class="flex items-center gap-3">
                <TrophyIcon
                  class="w-5 h-5 flex-shrink-0"
                  :class="iconColorCompeticion[comp.tipo]"
                />
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide opacity-60">
                    {{ labelCompeticion[comp.tipo] || comp.tipo }}
                  </p>
                  <p class="font-bold text-notion-text">{{ comp.nombre }}</p>
                </div>
              </div>
              <button
                v-if="canManage"
                @click="deletePalmares(temp.id, comp.tipo)"
                class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                title="Eliminar"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Sin competiciones -->
            <div
              v-if="temp.competiciones.length === 0"
              class="p-4 rounded-xl border border-dashed border-notion-border text-center text-notion-muted text-sm"
            >
              Sin datos de campeones para esta temporada
            </div>
          </div>

          <!-- Máximo Goleador (solo si hay dato) -->
          <div
            v-if="temp.max_goleador"
            class="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200"
          >
            <div class="flex items-center gap-2 mb-2">
              <StarIcon class="w-5 h-5 text-blue-600" />
              <span class="font-semibold text-blue-800">Máximo Goleador</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold"
              >
                ⚽
              </div>
              <div>
                <p class="font-bold text-notion-text">
                  {{ temp.max_goleador }}
                </p>
                <p v-if="temp.goles" class="text-sm text-notion-muted">
                  {{ temp.goles }} goles
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state si no hay temporadas -->
      <div
        v-if="temporadas.length === 0"
        class="text-center py-12 text-notion-muted"
      >
        <TrophyIcon class="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>No hay temporadas registradas todavía</p>
      </div>
    </template>

    <!-- Modal admin: Añadir Palmarés -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <h2 class="text-xl font-semibold text-notion-text mb-6">
          Añadir Palmarés
        </h2>

        <form @submit.prevent="handleSave" class="space-y-4">
          <!-- Temporada -->
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              Temporada
            </label>
            <select v-model="form.temporada_id" class="input" required>
              <option value="" disabled>Seleccionar temporada...</option>
              <option
                v-for="t in temporadasList"
                :key="t.id"
                :value="t.id"
              >
                {{ t.nombre }}
              </option>
            </select>
          </div>

          <!-- Tipo de competición -->
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              Tipo de competición
            </label>
            <select v-model="form.tipo_competicion" class="input">
              <option value="liga">Liga FUTSALVALL</option>
              <option value="copa">Copa FUTSALVALL</option>
              <option value="supercopa">Supercopa FUTSALVALL</option>
            </select>
          </div>

          <!-- Nombre del equipo -->
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              Equipo campeón
            </label>
            <input
              v-model="form.nombre_equipo"
              type="text"
              class="input"
              placeholder="Ej: BESOLLA FC"
              required
            />
          </div>

          <!-- Error -->
          <p
            v-if="errorMsg"
            class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
          >
            {{ errorMsg }}
          </p>

          <!-- Botones -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="btn-outline flex-1"
              @click="closeModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary flex-1 flex items-center justify-center gap-2"
              :disabled="saving"
            >
              <span
                v-if="saving"
                class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
              ></span>
              {{ saving ? "Guardando..." : "Añadir" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
