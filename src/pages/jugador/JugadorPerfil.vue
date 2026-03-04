<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { UserIcon, PencilIcon, UserGroupIcon } from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const perfil = ref(null);
const equipos = ref([]);
const solicitudes = ref([]);
const loading = ref(true);
const editing = ref(false);
const showSolicitarModal = ref(false);

const form = ref({
  nombre: "",
  posicion: "",
  numero_camiseta: "",
});

const posiciones = ["Portero", "Defensa", "Ala", "Cierre", "Universal"];

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    // Cargar perfil
    const { data: perfilData } = await supabase
      .from("profiles")
      .select("*, equipos(nombre, color_principal)")
      .eq("id", authStore.user.id)
      .single();

    perfil.value = perfilData;
    form.value = {
      nombre: perfilData?.nombre || "",
      posicion: perfilData?.posicion || "",
      numero_camiseta: perfilData?.numero_camiseta || "",
    };

    // Cargar equipos para solicitar
    const { data: equiposData } = await supabase
      .from("equipos")
      .select("id, nombre, color_principal");

    equipos.value = equiposData || [];

    // Cargar solicitudes del jugador
    const { data: solicitudesData } = await supabase
      .from("solicitudes_fichaje")
      .select("*, equipos(nombre)")
      .eq("jugador_id", authStore.user.id);

    solicitudes.value = solicitudesData || [];
  } catch (e) {
    // Datos de ejemplo
    perfil.value = {
      nombre: authStore.userName || "Jugador",
      posicion: "Ala",
      numero_camiseta: 7,
      libre: true,
      equipos: null,
    };
    equipos.value = [
      { id: 1, nombre: "Los Tigres", color_principal: "#164bf0" },
      { id: 2, nombre: "Águilas FC", color_principal: "#dc2626" },
      { id: 3, nombre: "La Vall United", color_principal: "#16a34a" },
    ];
    solicitudes.value = [
      { id: 1, estado: "pendiente", equipos: { nombre: "Los Tigres" } },
    ];
  } finally {
    loading.value = false;
  }
};

const isJugadorLibre = computed(
  () => perfil.value?.libre || !perfil.value?.equipo_id,
);

const saveProfile = async () => {
  try {
    await supabase
      .from("profiles")
      .update(form.value)
      .eq("id", authStore.user.id);

    perfil.value = { ...perfil.value, ...form.value };
    editing.value = false;
  } catch (e) {
    console.error("Error al guardar:", e);
    perfil.value = { ...perfil.value, ...form.value };
    editing.value = false;
  }
};

const solicitarEquipo = async (equipoId) => {
  try {
    await supabase.from("solicitudes_fichaje").insert({
      jugador_id: authStore.user.id,
      equipo_id: equipoId,
      estado: "pendiente",
    });

    await loadData();
    showSolicitarModal.value = false;
  } catch (e) {
    console.error("Error al solicitar:", e);
    // Simular solicitud
    const equipo = equipos.value.find((e) => e.id === equipoId);
    solicitudes.value.push({
      id: Date.now(),
      estado: "pendiente",
      equipos: { nombre: equipo.nombre },
    });
    showSolicitarModal.value = false;
  }
};

const getEstadoClass = (estado) => {
  switch (estado) {
    case "pendiente":
      return "badge-warning";
    case "aceptada":
      return "badge-success";
    case "rechazada":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Mi Perfil</h1>
      <p class="page-subtitle">Gestiona tu información y solicitudes</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Perfil -->
        <div class="lg:col-span-2">
          <div class="card p-6">
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center space-x-4">
                <div
                  class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
                >
                  <UserIcon class="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-notion-text">
                    {{ perfil?.nombre }}
                  </h2>
                  <div class="flex items-center space-x-2 mt-1">
                    <span
                      class="badge"
                      :class="
                        isJugadorLibre ? 'badge-warning' : 'badge-success'
                      "
                    >
                      {{ isJugadorLibre ? "Jugador Libre" : "En Equipo" }}
                    </span>
                    <span v-if="perfil?.rol" class="badge badge-primary">{{
                      perfil.rol
                    }}</span>
                  </div>
                </div>
              </div>
              <button
                v-if="!editing"
                @click="editing = true"
                class="btn-outline text-sm"
              >
                <PencilIcon class="w-4 h-4 mr-2" />
                Editar
              </button>
            </div>

            <!-- Form -->
            <form
              v-if="editing"
              @submit.prevent="saveProfile"
              class="space-y-4"
            >
              <div>
                <label class="block text-sm font-medium text-notion-text mb-2"
                  >Nombre</label
                >
                <input
                  v-model="form.nombre"
                  type="text"
                  required
                  class="input"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-notion-text mb-2"
                    >Posición</label
                  >
                  <select v-model="form.posicion" class="input">
                    <option value="">Sin posición</option>
                    <option v-for="pos in posiciones" :key="pos" :value="pos">
                      {{ pos }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-notion-text mb-2"
                    >Número de camiseta</label
                  >
                  <input
                    v-model="form.numero_camiseta"
                    type="number"
                    min="1"
                    max="99"
                    class="input"
                  />
                </div>
              </div>
              <div class="flex space-x-3 pt-4">
                <button
                  type="button"
                  @click="editing = false"
                  class="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" class="btn-primary flex-1">
                  Guardar
                </button>
              </div>
            </form>

            <!-- Info -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-notion-bg rounded-lg">
                  <p class="text-sm text-notion-muted">Posición</p>
                  <p class="font-medium text-notion-text">
                    {{ perfil?.posicion || "Sin definir" }}
                  </p>
                </div>
                <div class="p-4 bg-notion-bg rounded-lg">
                  <p class="text-sm text-notion-muted">Número</p>
                  <p class="font-medium text-notion-text">
                    {{ perfil?.numero_camiseta || "Sin definir" }}
                  </p>
                </div>
              </div>

              <!-- Equipo actual -->
              <div v-if="perfil?.equipos" class="p-4 bg-notion-bg rounded-lg">
                <p class="text-sm text-notion-muted mb-2">Equipo Actual</p>
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    :style="{
                      backgroundColor:
                        perfil.equipos.color_principal || '#164bf0',
                    }"
                  >
                    {{ perfil.equipos.nombre?.charAt(0) }}
                  </div>
                  <span class="font-medium text-notion-text">{{
                    perfil.equipos.nombre
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Solicitudes -->
        <div class="lg:col-span-1">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-notion-text">Mis Solicitudes</h3>
              <button
                v-if="isJugadorLibre"
                @click="showSolicitarModal = true"
                class="btn-primary text-xs py-1 px-3"
              >
                Solicitar equipo
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="solicitud in solicitudes"
                :key="solicitud.id"
                class="p-3 bg-notion-bg rounded-lg"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium text-notion-text text-sm">
                    {{ solicitud.equipos?.nombre }}
                  </span>
                  <span
                    :class="['badge text-xs', getEstadoClass(solicitud.estado)]"
                  >
                    {{ solicitud.estado }}
                  </span>
                </div>
              </div>
              <div
                v-if="solicitudes.length === 0"
                class="text-center py-4 text-notion-muted text-sm"
              >
                No tienes solicitudes
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Solicitar Equipo -->
    <div
      v-if="showSolicitarModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-6">
        <h2 class="text-xl font-semibold text-notion-text mb-6">
          Solicitar unirse a equipo
        </h2>

        <div class="space-y-3">
          <button
            v-for="equipo in equipos"
            :key="equipo.id"
            @click="solicitarEquipo(equipo.id)"
            class="w-full flex items-center space-x-3 p-4 bg-notion-bg rounded-lg hover:bg-primary/5 transition-colors"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              :style="{ backgroundColor: equipo.color_principal }"
            >
              {{ equipo.nombre.charAt(0) }}
            </div>
            <span class="font-medium text-notion-text">{{
              equipo.nombre
            }}</span>
          </button>
        </div>

        <button
          @click="showSolicitarModal = false"
          class="w-full mt-4 btn-outline"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>
