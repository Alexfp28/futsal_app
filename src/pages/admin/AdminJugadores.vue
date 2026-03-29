<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  TrashIcon,
  UserIcon,
  PencilIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const jugadores = ref([]);
const equipos = ref([]);
const loading = ref(true);
const error = ref(null);
const filtroRol = ref("");
const filtroLibre = ref("");
const filtroBusqueda = ref("");
const updatingPlayerId = ref(null);
const savingEdit = ref(false);

const showEditModal = ref(false);
const jugadorToEdit = ref(null);
const editError = ref("");
const editForm = ref({
  nombre: "",
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

const jugadoresFiltrados = () => {
  let result = jugadores.value;

  const busqueda = filtroBusqueda.value.trim().toLowerCase();

  if (busqueda) {
    result = result.filter((jugador) => {
      const numero = jugador.numero_camiseta != null ? String(jugador.numero_camiseta) : "";
      const equipoActual = jugador.equipos?.nombre || "";
      const estado = jugador.libre ? "libre en equipo sin equipo" : "en equipo ocupado";
      const searchableFields = [
        jugador.nombre || "",
        jugador.posicion || "",
        jugador.rol || "",
        numero,
        equipoActual,
        estado,
      ];

      return searchableFields.some((value) =>
        value.toLowerCase().includes(busqueda),
      );
    });
  }

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
    await supabase.from("profiles").update({ rol: nuevoRol }).eq("id", jugador.id);
    jugador.rol = nuevoRol;
  } catch (e) {
    console.error("Error al actualizar rol:", e);
  }
};

const updateEquipo = async (jugador, nuevoEquipoId) => {
  const equipoId = nuevoEquipoId || null;
  const previousEquipoId = jugador.equipo_id || "";
  const previousEquipoNombre = jugador.equipos?.nombre || null;
  const previousLibre = jugador.libre;

  updatingPlayerId.value = jugador.id;

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        equipo_id: equipoId,
        libre: !equipoId,
      })
      .eq("id", jugador.id);

    if (updateError) throw updateError;

    const { error: plantillaError } = await supabase
      .from("plantilla")
      .delete()
      .eq("jugador_id", jugador.id)
      .neq("equipo_id", equipoId || "00000000-0000-0000-0000-000000000000");

    if (plantillaError) throw plantillaError;

    const equipoSeleccionado = equipos.value.find((equipo) => equipo.id === equipoId);
    jugador.equipo_id = equipoId;
    jugador.libre = !equipoId;
    jugador.equipos = equipoSeleccionado
      ? { nombre: equipoSeleccionado.nombre }
      : null;
  } catch (e) {
    console.error("Error al actualizar equipo:", e);
    jugador.equipo_id = previousEquipoId || null;
    jugador.libre = previousLibre;
    jugador.equipos = previousEquipoNombre ? { nombre: previousEquipoNombre } : null;
  } finally {
    updatingPlayerId.value = null;
  }
};

const openEditModal = (jugador) => {
  jugadorToEdit.value = jugador;
  editError.value = "";
  editForm.value = {
    nombre: jugador.nombre || "",
    posicion: jugador.posicion || "",
    numero_camiseta: jugador.numero_camiseta ?? "",
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  if (savingEdit.value) return;

  showEditModal.value = false;
  jugadorToEdit.value = null;
  editError.value = "";
  editForm.value = {
    nombre: "",
    posicion: "",
    numero_camiseta: "",
  };
};

const saveJugadorEdit = async () => {
  if (!jugadorToEdit.value || savingEdit.value) return;

  const nombre = editForm.value.nombre.trim();
  const numeroValue = editForm.value.numero_camiseta;
  const numeroCamiseta =
    numeroValue === "" || numeroValue === null
      ? null
      : parseInt(numeroValue, 10);

  if (!nombre) {
    editError.value = "El nombre y apellidos son obligatorios.";
    return;
  }

  if (numeroValue !== "" && Number.isNaN(numeroCamiseta)) {
    editError.value = "El numero debe ser un valor valido.";
    return;
  }

  savingEdit.value = true;
  editError.value = "";

  try {
    const updates = {
      nombre,
      posicion: editForm.value.posicion || null,
      numero_camiseta: numeroCamiseta,
    };

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", jugadorToEdit.value.id)
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

    if (updateError) throw updateError;

    const jugadorActualizado = normalizeJugador(data);
    jugadores.value = jugadores.value.map((jugador) =>
      jugador.id === jugadorActualizado.id ? jugadorActualizado : jugador,
    );

    showEditModal.value = false;
    jugadorToEdit.value = null;
    editError.value = "";
    editForm.value = {
      nombre: "",
      posicion: "",
      numero_camiseta: "",
    };
  } catch (e) {
    console.error("Error al guardar jugador:", e);
    editError.value =
      "No se pudo guardar la informacion personal del jugador.";
  } finally {
    savingEdit.value = false;
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
    alert(
      e?.message ||
        "No se pudo eliminar el jugador. Revisa las politicas de Supabase para profiles.",
    );
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
  <div class="page-container max-w-[96rem]">
    <div class="mb-8">
      <div>
        <h1 class="page-title">Gestionar Jugadores</h1>
        <p class="page-subtitle">
          Administra los jugadores registrados que ya han accedido a la plataforma.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-4 mb-6">
      <div class="min-w-[260px] flex-1">
        <label class="block text-sm font-medium text-notion-text mb-2">
          Buscar
        </label>
        <div class="relative">
          <MagnifyingGlassIcon
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-notion-muted"
          />
          <input
            v-model="filtroBusqueda"
            type="text"
            class="input w-full pl-10 pr-10"
            placeholder="Nombre, posicion, rol, equipo, numero o estado"
          />
          <button
            v-if="filtroBusqueda"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-notion-muted transition-colors hover:bg-notion-bg hover:text-notion-text"
            @click="filtroBusqueda = ''"
            aria-label="Limpiar busqueda"
            title="Limpiar busqueda"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
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
        <table class="w-full min-w-[1280px] table-fixed">
          <thead class="bg-notion-bg">
            <tr>
              <th class="w-[24%] text-left py-4 px-4 text-sm font-medium text-notion-muted">
                Jugador
              </th>
              <th class="w-[12%] text-left py-4 px-4 text-sm font-medium text-notion-muted">
                Posicion
              </th>
              <th class="w-[12%] text-left py-4 px-4 text-sm font-medium text-notion-muted">
                Rol
              </th>
              <th class="w-[16%] text-left py-4 px-4 text-sm font-medium text-notion-muted">
                Equipo actual
              </th>
              <th class="w-[20%] text-left py-4 px-4 text-sm font-medium text-notion-muted">
                Asignar equipo
              </th>
              <th class="w-[8%] text-left py-4 px-4 text-sm font-medium text-notion-muted">
                Estado
              </th>
              <th class="w-[8%] text-right py-4 px-4 text-sm font-medium text-notion-muted">
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
              <td class="py-4 px-4">
                <div class="flex items-center space-x-3 min-w-0">
                  <div
                    class="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <UserIcon class="w-5 h-5 text-primary" />
                  </div>
                  <span class="truncate font-medium text-notion-text">{{ jugador.nombre }}</span>
                </div>
              </td>
              <td class="py-4 px-4 text-sm text-notion-muted">
                <span class="block truncate">{{ jugador.posicion || "-" }}</span>
              </td>
              <td class="py-4 px-4">
                <select
                  :value="jugador.rol"
                  @change="updateRol(jugador, $event.target.value)"
                  class="w-full text-sm border border-notion-border rounded-lg px-2 py-1"
                >
                  <option v-for="rol in roles" :key="rol" :value="rol">
                    {{ rol }}
                  </option>
                </select>
              </td>
              <td class="py-4 px-4 text-sm text-notion-muted">
                <span class="block truncate">{{ jugador.equipos?.nombre || "-" }}</span>
              </td>
              <td class="py-4 px-4">
                <div class="w-full">
                  <select
                    :value="jugador.equipo_id || ''"
                    @change="updateEquipo(jugador, $event.target.value)"
                    :disabled="updatingPlayerId === jugador.id"
                    class="input w-full text-sm py-2"
                  >
                    <option value="">Sin equipo</option>
                    <option v-for="equipo in equipos" :key="equipo.id" :value="equipo.id">
                      {{ equipo.nombre }}
                    </option>
                  </select>
                </div>
              </td>
              <td class="py-4 px-4">
                <span v-if="jugador.libre" class="badge badge-warning">Libre</span>
                <span v-else class="badge badge-success">En equipo</span>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="openEditModal(jugador)"
                    class="p-2 text-notion-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Editar jugador"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
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
              <td colspan="7" class="py-12 px-4 text-center text-notion-muted text-sm">
                No hay jugadores que coincidan con los filtros actuales.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeEditModal"
        ></div>

        <div
          class="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editar-jugador-title"
        >
          <div class="flex items-start justify-between border-b border-notion-border p-6">
            <div>
              <h3 id="editar-jugador-title" class="text-lg font-semibold text-notion-text">
                Editar jugador
              </h3>
              <p class="mt-1 text-sm text-notion-muted">
                Actualiza nombre y apellidos, posicion y numero de camiseta.
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg p-2 text-notion-muted transition-colors hover:bg-notion-bg hover:text-notion-text"
              @click="closeEditModal"
              :disabled="savingEdit"
              aria-label="Cerrar modal"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <form @submit.prevent="saveJugadorEdit" class="space-y-5 p-6">
            <div v-if="editError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ editError }}
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-notion-text">
                Nombre y apellidos
              </label>
              <input
                v-model="editForm.nombre"
                type="text"
                class="input"
                placeholder="Nombre completo del jugador"
                :disabled="savingEdit"
                required
              />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">
                  Posicion
                </label>
                <select
                  v-model="editForm.posicion"
                  class="input"
                  :disabled="savingEdit"
                >
                  <option value="">Sin definir</option>
                  <option v-for="posicion in posiciones" :key="posicion" :value="posicion">
                    {{ posicion }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-notion-text">
                  Numero
                </label>
                <input
                  v-model="editForm.numero_camiseta"
                  type="number"
                  min="0"
                  class="input"
                  placeholder="Ej. 10"
                  :disabled="savingEdit"
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-notion-border px-4 py-2 text-sm font-medium text-notion-text transition-colors hover:bg-notion-bg"
                @click="closeEditModal"
                :disabled="savingEdit"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="savingEdit"
              >
                {{ savingEdit ? "Guardando..." : "Guardar cambios" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
