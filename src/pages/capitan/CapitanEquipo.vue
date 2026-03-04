<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { UserIcon, UserPlusIcon, XMarkIcon } from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const equipo = ref(null);
const jugadores = ref([]);
const jugadoresLibres = ref([]);
const loading = ref(true);
const showFicharModal = ref(false);

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    // Cargar equipo del capitán
    const { data: equipoData } = await supabase
      .from("equipos")
      .select("*")
      .eq("capitan_id", authStore.user.id)
      .single();

    equipo.value = equipoData;

    // Cargar jugadores del equipo
    if (equipoData) {
      const { data: jugadoresData } = await supabase
        .from("profiles")
        .select("*")
        .eq("equipo_id", equipoData.id);

      jugadores.value = jugadoresData || [];
    }

    // Cargar jugadores libres
    const { data: libresData } = await supabase
      .from("profiles")
      .select("*")
      .eq("libre", true);

    jugadoresLibres.value = libresData || [];
  } catch (e) {
    // Datos de ejemplo
    equipo.value = {
      id: 1,
      nombre: "Los Tigres",
      color_principal: "#164bf0",
      color_secundario: "#f6ec15",
    };
    jugadores.value = [
      {
        id: 1,
        nombre: "Carlos García",
        posicion: "Ala",
        numero_camiseta: 7,
        rol: "capitan",
      },
      {
        id: 2,
        nombre: "Pedro Ruiz",
        posicion: "Portero",
        numero_camiseta: 1,
        rol: "jugador",
      },
      {
        id: 3,
        nombre: "Miguel Torres",
        posicion: "Cierre",
        numero_camiseta: 4,
        rol: "jugador",
      },
      {
        id: 4,
        nombre: "Luis Fernández",
        posicion: "Ala",
        numero_camiseta: 10,
        rol: "jugador",
      },
    ];
    jugadoresLibres.value = [
      { id: 5, nombre: "Alejandro Sánchez", posicion: "Portero" },
      { id: 6, nombre: "Bruno López", posicion: "Ala" },
    ];
  } finally {
    loading.value = false;
  }
};

const ficharJugador = async (jugador) => {
  try {
    // Actualizar el jugador con el equipo
    await supabase
      .from("profiles")
      .update({ equipo_id: equipo.value.id, libre: false })
      .eq("id", jugador.id);

    // Recargar datos
    await loadData();
    showFicharModal.value = false;
  } catch (e) {
    console.error("Error al fichar:", e);
    // Simular fichaje
    jugadores.value.push({
      ...jugador,
      equipo_id: equipo.value.id,
      libre: false,
    });
    jugadoresLibres.value = jugadoresLibres.value.filter(
      (j) => j.id !== jugador.id,
    );
    showFicharModal.value = false;
  }
};

const expulsarJugador = async (jugador) => {
  if (confirm(`¿Estás seguro de expulsar a ${jugador.nombre} del equipo?`)) {
    try {
      await supabase
        .from("profiles")
        .update({ equipo_id: null, libre: true })
        .eq("id", jugador.id);

      await loadData();
    } catch (e) {
      console.error("Error al expulsar:", e);
      // Simular expulsión
      jugadores.value = jugadores.value.filter((j) => j.id !== jugador.id);
      jugadoresLibres.value.push({ ...jugador, equipo_id: null, libre: true });
    }
  }
};
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="page-title">Mi Equipo</h1>
        <p class="page-subtitle">Gestiona los jugadores de tu equipo</p>
      </div>
      <button
        @click="showFicharModal = true"
        class="btn-primary flex items-center space-x-2"
      >
        <UserPlusIcon class="w-5 h-5" />
        <span>Fichar Jugador</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <!-- Info del equipo -->
      <div class="card p-6 mb-8">
        <div class="flex items-center space-x-4">
          <div
            class="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl"
            :style="{ backgroundColor: equipo?.color_principal || '#164bf0' }"
          >
            {{ equipo?.nombre?.charAt(0) || "?" }}
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-notion-text">
              {{ equipo?.nombre }}
            </h2>
            <div class="flex items-center space-x-4 mt-2">
              <div class="flex items-center space-x-2">
                <span class="text-sm text-notion-muted">Colores:</span>
                <div
                  class="w-5 h-5 rounded-full border border-notion-border"
                  :style="{ backgroundColor: equipo?.color_principal }"
                ></div>
                <div
                  class="w-5 h-5 rounded-full border border-notion-border"
                  :style="{ backgroundColor: equipo?.color_secundario }"
                ></div>
              </div>
              <span class="text-sm text-notion-muted">
                {{ jugadores.length }} jugadores
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de jugadores -->
      <div class="card overflow-hidden">
        <div class="p-4 border-b border-notion-border">
          <h3 class="font-semibold text-notion-text">Plantilla</h3>
        </div>
        <div class="divide-y divide-notion-border">
          <div
            v-for="jugador in jugadores"
            :key="jugador.id"
            class="flex items-center justify-between p-4 hover:bg-notion-bg transition-colors"
          >
            <div class="flex items-center space-x-4">
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <span class="text-primary font-bold">{{
                  jugador.numero_camiseta || "?"
                }}</span>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-notion-text">{{
                    jugador.nombre
                  }}</span>
                  <span
                    v-if="jugador.rol === 'capitan'"
                    class="badge badge-secondary text-xs"
                    >Capitán</span
                  >
                </div>
                <span class="text-sm text-notion-muted">{{
                  jugador.posicion || "Sin posición"
                }}</span>
              </div>
            </div>
            <button
              v-if="jugador.rol !== 'capitan'"
              @click="expulsarJugador(jugador)"
              class="p-2 text-notion-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Fichar -->
    <div
      v-if="showFicharModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-notion-text">Fichar Jugador</h2>
          <button
            @click="showFicharModal = false"
            class="p-2 hover:bg-notion-bg rounded-lg"
          >
            <XMarkIcon class="w-5 h-5 text-notion-muted" />
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="jugador in jugadoresLibres"
            :key="jugador.id"
            class="flex items-center justify-between p-3 bg-notion-bg rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <UserIcon class="w-5 h-5 text-primary" />
              </div>
              <div>
                <p class="font-medium text-notion-text text-sm">
                  {{ jugador.nombre }}
                </p>
                <p class="text-xs text-notion-muted">
                  {{ jugador.posicion || "Sin posición" }}
                </p>
              </div>
            </div>
            <button
              @click="ficharJugador(jugador)"
              class="btn-primary text-xs py-1 px-3"
            >
              Fichar
            </button>
          </div>
          <div
            v-if="jugadoresLibres.length === 0"
            class="text-center py-8 text-notion-muted"
          >
            No hay jugadores libres disponibles
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
