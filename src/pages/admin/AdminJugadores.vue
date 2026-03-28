<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  PlusIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const jugadores = ref([]);
const equipos = ref([]);
const loading = ref(true);
const error = ref(null);
const filtroRol = ref("");
const filtroLibre = ref("");
const saving = ref(false);
const formError = ref("");
const showCreateModal = ref(false);

const form = ref({
  nombre: "",
  equipo_id: "",
  posicion: "",
  numero_camiseta: "",
});

// Estado para el dialogo de confirmacion de eliminacion
const showDeleteDialog = ref(false);
const jugadorToDelete = ref(null);

const roles = ["admin", "capitan", "jugador"];
const posiciones = ["Portero", "Defensa", "Ala", "Cierre", "Universal"];

const normalizeJugador = (jugador) => ({
  ...jugador,
  equipos: jugador.equipos ? { nombre: jugador.equipos.nombre } : null,
});

const loadJugadores = async () => {
  loading.value = true;
  error.value = null;

  try {
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

    jugadores.value = (data || []).map(normalizeJugador);
  } catch (e) {
    console.error("Error al cargar jugadores:", e);
    error.value = "Error al cargar los jugadores. Por favor, intenta de nuevo.";
    jugadores.value = [];
  } finally {
    loading.value = false;
  }
};

const loadEquipos = async () => {
  try {
    const { data, error: queryError } = await supabase
      .from("equipos")
      .select("id, nombre")
      .order("nombre", { ascending: true });

    if (queryError) throw queryError;

    equipos.value = data || [];
  } catch (e) {
    console.error("Error al cargar equipos:", e);
    equipos.value = [];
  }
};

onMounted(async () => {
  await Promise.all([loadJugadores(), loadEquipos()]);
});

useRouteRefresh(async () => {
  await Promise.all([loadJugadores(), loadEquipos()]);
});

const resetForm = () => {
  form.value = {
    nombre: "",
    equipo_id: "",
    posicion: "",
    numero_camiseta: "",
  };
  formError.value = "";
};

const openCreateModal = () => {
  resetForm();
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  resetForm();
};

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

const createJugador = async () => {
  formError.value = "";

  const nombre = form.value.nombre.trim();
  const equipoId = form.value.equipo_id;
  const numeroCamiseta =
    form.value.numero_camiseta === "" ? null : Number(form.value.numero_camiseta);

  if (!nombre) {
    formError.value = "El nombre del jugador es obligatorio.";
    return;
  }

  if (!equipoId) {
    formError.value = "Debes asignar un equipo al jugador.";
    return;
  }

  if (
    numeroCamiseta !== null &&
    (!Number.isInteger(numeroCamiseta) || numeroCamiseta < 0)
  ) {
    formError.value = "El numero de camiseta debe ser un entero valido.";
    return;
  }

  saving.value = true;

  try {
    const payload = {
      id: crypto.randomUUID(),
      nombre,
      rol: "jugador",
      equipo_id: equipoId,
      posicion: form.value.posicion || null,
      numero_camiseta: numeroCamiseta,
      libre: false,
    };

    const { data, error: insertError } = await supabase
      .from("profiles")
      .insert(payload)
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
      .single();

    if (insertError) throw insertError;

    jugadores.value = [...jugadores.value, normalizeJugador(data)].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es"),
    );
    closeCreateModal();
  } catch (e) {
    console.error("Error al crear jugador:", e);
    formError.value =
      e?.message ||
      "No se pudo crear el jugador. Revisa la migracion SQL de perfiles sin cuenta y vuelve a intentarlo.";
  } finally {
    saving.value = false;
  }
};

const updateRol = async (jugador, nuevoRol) => {
  try {
    await supabase.from("profiles").update({ rol: nuevoRol }).eq("id", jugador.id);
    jugador.rol = nuevoRol;
  } catch (e) {
    console.error("Error al actualizar rol:", e);
  }
};

const confirmDeleteJugador = (jugador) => {
  jugadorToDelete.value = jugador;
  showDeleteDialog.value = true;
};

const handleDeleteConfirm = async () => {
  if (!jugadorToDelete.value) return;

  try {
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", jugadorToDelete.value.id);

    if (deleteError) throw deleteError;

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

const handleDeleteCancel = () => {
  showDeleteDialog.value = false;
  jugadorToDelete.value = null;
};
</script>

<template>
  <div class="page-container">
    <div class="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 class="page-title">Gestionar Jugadores</h1>
        <p class="page-subtitle">
          Administra todos los jugadores registrados y da de alta nuevos perfiles.
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="btn-primary flex items-center gap-2 whitespace-nowrap"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Nuevo jugador</span>
      </button>
    </div>

    <div class="flex flex-wrap gap-4 mb-6">
      <div>
        <label class="block text-sm font-medium text-notion-text mb-2">Rol</label>
        <select v-model="filtroRol" class="input min-w-[150px]">
          <option value="">Todos</option>
          <option v-for="rol in roles" :key="rol" :value="rol">
            {{ rol }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-notion-text mb-2">
          Estado
        </label>
        <select v-model="filtroLibre" class="input min-w-[150px]">
          <option value="">Todos</option>
          <option value="libre">Jugadores libres</option>
          <option value="equipo">Con equipo</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

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

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-notion-bg">
            <tr>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">
                Jugador
              </th>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">
                Posicion
              </th>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">
                Rol
              </th>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">
                Equipo
              </th>
              <th class="text-left py-4 px-6 text-sm font-medium text-notion-muted">
                Estado
              </th>
              <th class="text-right py-4 px-6 text-sm font-medium text-notion-muted">
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
                  <span class="font-medium text-notion-text">{{ jugador.nombre }}</span>
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
                <span v-if="jugador.libre" class="badge badge-warning">Libre</span>
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
            <tr v-if="jugadoresFiltrados().length === 0">
              <td colspan="6" class="py-12 text-center text-notion-muted text-sm">
                No hay jugadores que coincidan con los filtros actuales.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div
    v-if="showCreateModal"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="closeCreateModal"
  >
    <div class="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-semibold text-notion-text">Nuevo jugador</h2>
          <p class="text-sm text-notion-muted mt-1">
            Crea un perfil manual sin necesidad de que el jugador tenga cuenta.
          </p>
        </div>
        <button
          type="button"
          @click="closeCreateModal"
          class="p-2 text-notion-muted hover:text-notion-text hover:bg-notion-bg rounded-lg transition-colors"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="createJugador" class="space-y-5">
        <div
          v-if="formError"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-sm font-medium text-notion-text mb-2">
            Nombre
          </label>
          <input
            v-model="form.nombre"
            type="text"
            required
            class="input"
            placeholder="Nombre completo del jugador"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-notion-text mb-2">
            Equipo
          </label>
          <select v-model="form.equipo_id" required class="input">
            <option value="">Selecciona un equipo</option>
            <option v-for="equipo in equipos" :key="equipo.id" :value="equipo.id">
              {{ equipo.nombre }}
            </option>
          </select>
          <p class="text-xs text-notion-muted mt-2">
            La asignacion a equipo es obligatoria para este alta manual.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              Posicion
            </label>
            <select v-model="form.posicion" class="input">
              <option value="">Sin especificar</option>
              <option v-for="posicion in posiciones" :key="posicion" :value="posicion">
                {{ posicion }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              Numero de camiseta
            </label>
            <input
              v-model="form.numero_camiseta"
              type="number"
              min="0"
              step="1"
              class="input"
              placeholder="Ej. 10"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button type="button" @click="closeCreateModal" class="btn-outline">
            Cancelar
          </button>
          <button type="submit" :disabled="saving" class="btn-primary min-w-[140px]">
            {{ saving ? "Guardando..." : "Crear jugador" }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <ConfirmDialog
    :show="showDeleteDialog"
    title="Eliminar jugador"
    :message="`Estas seguro de que deseas eliminar a ${jugadorToDelete?.nombre || 'este jugador'}? Esta accion no se puede deshacer.`"
    confirm-text="Eliminar"
    cancel-text="Cancelar"
    type="danger"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
    @close="handleDeleteCancel"
  />
</template>
