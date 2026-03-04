<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/vue/24/outline";

const partidos = ref([]);
const equipos = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingPartido = ref(null);
const form = ref({
  equipo_local_id: "",
  equipo_visitante_id: "",
  fecha: "",
  lugar: "Polideportivo Municipal",
  estado: "programado",
});

const estados = ["programado", "jugado", "cancelado"];

onMounted(async () => {
  await Promise.all([loadPartidos(), loadEquipos()]);
});

const loadPartidos = async () => {
  try {
    const { data, error } = await supabase
      .from("partidos")
      .select(
        "*, equipo_local:equipos!partidos_equipo_local_id_fkey(nombre), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre)",
      )
      .order("fecha");

    if (error) throw error;
    partidos.value = data || [];
  } catch (e) {
    // Datos de ejemplo
    partidos.value = [
      {
        id: 1,
        fecha: "2024-03-15T18:00:00",
        lugar: "Polideportivo Municipal",
        estado: "programado",
        equipo_local: { nombre: "Los Tigres" },
        equipo_visitante: { nombre: "Águilas FC" },
        goles_local: null,
        goles_visitante: null,
      },
      {
        id: 2,
        fecha: "2024-03-22T18:00:00",
        lugar: "Pabellón San José",
        estado: "programado",
        equipo_local: { nombre: "La Vall United" },
        equipo_visitante: { nombre: "Deportivo Juventud" },
        goles_local: null,
        goles_visitante: null,
      },
    ];
  } finally {
    loading.value = false;
  }
};

const loadEquipos = async () => {
  try {
    const { data, error } = await supabase.from("equipos").select("id, nombre");
    if (error) throw error;
    equipos.value = data || [];
  } catch (e) {
    equipos.value = [
      { id: 1, nombre: "Los Tigres" },
      { id: 2, nombre: "Águilas FC" },
      { id: 3, nombre: "La Vall United" },
      { id: 4, nombre: "Deportivo Juventud" },
    ];
  }
};

const openModal = (partido = null) => {
  if (partido) {
    editingPartido.value = partido;
    form.value = {
      equipo_local_id: partido.equipo_local_id,
      equipo_visitante_id: partido.equipo_visitante_id,
      fecha: partido.fecha,
      lugar: partido.lugar,
      estado: partido.estado,
    };
  } else {
    editingPartido.value = null;
    form.value = {
      equipo_local_id: "",
      equipo_visitante_id: "",
      fecha: "",
      lugar: "Polideportivo Municipal",
      estado: "programado",
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingPartido.value = null;
};

const savePartido = async () => {
  try {
    if (editingPartido.value) {
      await supabase
        .from("partidos")
        .update(form.value)
        .eq("id", editingPartido.value.id);
    } else {
      await supabase.from("partidos").insert(form.value);
    }
    await loadPartidos();
    closeModal();
  } catch (e) {
    console.error("Error al guardar:", e);
  }
};

const deletePartido = async (id) => {
  if (confirm("¿Estás seguro de eliminar este partido?")) {
    try {
      await supabase.from("partidos").delete().eq("id", id);
      partidos.value = partidos.value.filter((p) => p.id !== id);
    } catch (e) {
      console.error("Error al eliminar:", e);
    }
  }
};

const formatDate = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEstadoClass = (estado) => {
  switch (estado) {
    case "programado":
      return "badge-primary";
    case "jugado":
      return "badge-success";
    case "cancelado":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
};
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="page-title">Gestionar Partidos</h1>
        <p class="page-subtitle">
          Programa y gestiona los partidos de la organización
        </p>
      </div>
      <button
        @click="openModal()"
        class="btn-primary flex items-center space-x-2"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Nuevo Partido</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-notion-bg">
            <tr>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Fecha
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Partido
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Lugar
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Estado
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Resultado
              </th>
              <th
                class="text-right py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="partido in partidos"
              :key="partido.id"
              class="border-t border-notion-border hover:bg-notion-bg transition-colors"
            >
              <td class="py-4 px-6 text-sm text-notion-muted">
                {{ formatDate(partido.fecha) }}
              </td>
              <td class="py-4 px-6">
                <span class="font-medium text-notion-text">{{
                  partido.equipo_local?.nombre
                }}</span>
                <span class="text-notion-muted mx-2">vs</span>
                <span class="font-medium text-notion-text">{{
                  partido.equipo_visitante?.nombre
                }}</span>
              </td>
              <td class="py-4 px-6 text-sm text-notion-muted">
                {{ partido.lugar }}
              </td>
              <td class="py-4 px-6">
                <span :class="['badge', getEstadoClass(partido.estado)]">
                  {{ partido.estado }}
                </span>
              </td>
              <td class="py-4 px-6 text-sm font-medium text-notion-text">
                <span v-if="partido.goles_local !== null">
                  {{ partido.goles_local }} - {{ partido.goles_visitante }}
                </span>
                <span v-else class="text-notion-muted">-</span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="openModal(partido)"
                    class="p-2 text-notion-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="deletePartido(partido.id)"
                    class="p-2 text-notion-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-6">
        <h2 class="text-xl font-semibold text-notion-text mb-6">
          {{ editingPartido ? "Editar Partido" : "Nuevo Partido" }}
        </h2>

        <form @submit.prevent="savePartido" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Equipo Local</label
            >
            <select v-model="form.equipo_local_id" required class="input">
              <option value="">Seleccionar equipo</option>
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
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Equipo Visitante</label
            >
            <select v-model="form.equipo_visitante_id" required class="input">
              <option value="">Seleccionar equipo</option>
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
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Fecha y Hora</label
            >
            <input
              v-model="form.fecha"
              type="datetime-local"
              required
              class="input"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Lugar</label
            >
            <input
              v-model="form.lugar"
              type="text"
              required
              class="input"
              placeholder="Lugar del partido"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Estado</label
            >
            <select v-model="form.estado" class="input">
              <option v-for="estado in estados" :key="estado" :value="estado">
                {{ estado }}
              </option>
            </select>
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="btn-outline flex-1"
            >
              Cancelar
            </button>
            <button type="submit" class="btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
