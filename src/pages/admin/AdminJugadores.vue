<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { PencilIcon, TrashIcon, UserIcon } from "@heroicons/vue/24/outline";

const jugadores = ref([]);
const loading = ref(true);
const filtroRol = ref("");
const filtroLibre = ref("");

const roles = ["admin", "capitan", "jugador"];

onMounted(async () => {
  await loadJugadores();
});

const loadJugadores = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, equipos(nombre)")
      .order("nombre");

    if (error) throw error;
    jugadores.value = data || [];
  } catch (e) {
    // Datos de ejemplo
    jugadores.value = [
      {
        id: 1,
        nombre: "Carlos García",
        rol: "capitan",
        libre: false,
        equipos: { nombre: "Los Tigres" },
        posicion: "Ala",
      },
      {
        id: 2,
        nombre: "Miguel Torres",
        rol: "capitan",
        libre: false,
        equipos: { nombre: "Águilas FC" },
        posicion: "Portero",
      },
      {
        id: 3,
        nombre: "Pedro Martínez",
        rol: "jugador",
        libre: false,
        equipos: { nombre: "La Vall United" },
        posicion: "Cierre",
      },
      {
        id: 4,
        nombre: "Alejandro Sánchez",
        rol: "jugador",
        libre: true,
        equipos: null,
        posicion: "Portero",
      },
      {
        id: 5,
        nombre: "Bruno López",
        rol: "jugador",
        libre: true,
        equipos: null,
        posicion: "Ala",
      },
      {
        id: 6,
        nombre: "Admin Principal",
        rol: "admin",
        libre: false,
        equipos: null,
        posicion: null,
      },
    ];
  } finally {
    loading.value = false;
  }
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

const deleteJugador = async (id) => {
  if (confirm("¿Estás seguro de eliminar este jugador?")) {
    try {
      await supabase.from("profiles").delete().eq("id", id);
      jugadores.value = jugadores.value.filter((j) => j.id !== id);
    } catch (e) {
      console.error("Error al eliminar:", e);
    }
  }
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
                    @click="deleteJugador(jugador.id)"
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
  </div>
</template>
