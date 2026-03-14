<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  PencilIcon,
  TrashIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const jugadores = ref([]);
const loading = ref(true);
const error = ref(null);
const filtroRol = ref("");
const filtroLibre = ref("");

// Estado para el diálogo de confirmación de eliminación
const showDeleteDialog = ref(false);
const jugadorToDelete = ref(null);

const roles = ["admin", "capitan", "jugador"];

const loadJugadores = async () => {
  loading.value = true;
  error.value = null;
  try {
    // Query corregida para obtener perfiles con su equipo relacionado
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        nombre,
        rol,
        posicion,
        numero_camiseta,
        libre,
        equipo_id,
        equipos:equipos!profiles_equipo_id_fkey (id, nombre)
      `,
      )
      .order("nombre", { ascending: true });

    if (queryError) throw queryError;

    // Transformar los datos para que tengan el formato esperado
    jugadores.value = (data || []).map((jugador) => ({
      ...jugador,
      equipos: jugador.equipos ? { nombre: jugador.equipos.nombre } : null,
    }));
  } catch (e) {
    console.error("Error al cargar jugadores:", e);
    error.value = "Error al cargar los jugadores. Por favor, intenta de nuevo.";
    jugadores.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadJugadores();
});

// Recargar datos cuando se navega hacia atrás o a esta ruta
useRouteRefresh(loadJugadores);

const jugadoresFiltrados = () => {
  let result = jugadores.value;
  if (filtroRol.value) {
    result = result.filter((j) => j.rol === filtroRol.value);
  }
  if (filtroLibre.value === "libre") {
    result = result.filter((j) => j.libre);
  } else if (filtroLibre.value === "equipo") {
    result = result.filter((j) => !j.libre);
  }
  return result;
};

const updateRol = async (jugador, nuevoRol) => {
  try {
    await supabase
      .from("profiles")
      .update({ rol: nuevoRol })
      .eq("id", jugador.id);
    jugador.rol = nuevoRol;
  } catch (e) {
    console.error("Error al actualizar rol:", e);
  }
};

// Abrir diálogo de confirmación de eliminación
const confirmDeleteJugador = (jugador) => {
  jugadorToDelete.value = jugador;
  showDeleteDialog.value = true;
};

// Eliminar jugador después de confirmación
const handleDeleteConfirm = async () => {
  if (!jugadorToDelete.value) return;

  try {
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", jugadorToDelete.value.id);

    if (deleteError) throw deleteError;

    // Eliminar de la lista local
    jugadores.value = jugadores.value.filter(
      (j) => j.id !== jugadorToDelete.value.id,
    );
  } catch (e) {
    console.error("Error al eliminar:", e);
  } finally {
    showDeleteDialog.value = false;
    jugadorToDelete.value = null;
  }
};

// Cancelar eliminación
const handleDeleteCancel = () => {
  showDeleteDialog.value = false;
  jugadorToDelete.value = null;
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Gestionar Jugadores</h1>
      <p class="page-subtitle">Administra todos los jugadores registrados</p>
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div>
        <label class="block text-sm font-medium text-notion-text mb-2"
          >Rol</label
        >
        <select v-model="filtroRol" class="input min-w-[150px]">
          <option value="">Todos</option>
          <option v-for="rol in roles" :key="rol" :value="rol">
            {{ rol }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-notion-text mb-2"
          >Estado</label
        >
        <select v-model="filtroLibre" class="input min-w-[150px]">
          <option value="">Todos</option>
          <option value="libre">Jugadores libres</option>
          <option value="equipo">Con equipo</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="card bg-red-50 border-red-200">
      <div class="flex items-center gap-3 text-red-700">
        <ExclamationTriangleIcon class="w-6 h-6" />
        <p>{{ error }}</p>
        <button
          @click="loadJugadores"
          class="ml-auto text-sm font-medium text-red-600 hover:text-red-800 underline"
        >
          Reintentar
        </button>
      </div>
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
                Jugador
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Posición
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Rol
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Equipo
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Estado
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
              v-for="jugador in jugadoresFiltrados()"
              :key="jugador.id"
              class="border-t border-notion-border hover:bg-notion-bg transition-colors"
            >
              <td class="py-4 px-6">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"
                  >
                    <UserIcon class="w-5 h-5 text-primary" />
                  </div>
                  <span class="font-medium text-notion-text">{{
                    jugador.nombre
                  }}</span>
                </div>
              </td>
              <td class="py-4 px-6 text-sm text-notion-muted">
                {{ jugador.posicion || "-" }}
              </td>
              <td class="py-4 px-6">
                <select
                  :value="jugador.rol"
                  @change="updateRol(jugador, $event.target.value)"
                  class="text-sm border border-notion-border rounded-lg px-2 py-1"
                >
                  <option v-for="rol in roles" :key="rol" :value="rol">
                    {{ rol }}
                  </option>
                </select>
              </td>
              <td class="py-4 px-6 text-sm text-notion-muted">
                {{ jugador.equipos?.nombre || "-" }}
              </td>
              <td class="py-4 px-6">
                <span v-if="jugador.libre" class="badge badge-warning"
                  >Libre</span
                >
                <span v-else class="badge badge-success">En equipo</span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="confirmDeleteJugador(jugador)"
                    class="p-2 text-notion-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar jugador"
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
  </div>

  <!-- Diálogo de confirmación de eliminación -->
  <ConfirmDialog
    :show="showDeleteDialog"
    title="Eliminar jugador"
    :message="`¿Estás seguro de que deseas eliminar a ${jugadorToDelete?.nombre || 'este jugador'}? Esta acción no se puede deshacer.`"
    confirm-text="Eliminar"
    cancel-text="Cancelar"
    type="danger"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
    @close="handleDeleteCancel"
  />
</template>
