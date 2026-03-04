<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import {
  UserGroupIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const equipo = ref(null);
const jugadoresLibres = ref([]);
const proximosPartidos = ref([]);
const loading = ref(true);

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    // Cargar equipo del capitán
    const { data: equipoData } = await supabase
      .from("equipos")
      .select("*, profiles!equipos_capitan_id_fkey(nombre)")
      .eq("capitan_id", authStore.user.id)
      .single();

    equipo.value = equipoData;

    // Cargar jugadores del equipo
    if (equipoData) {
      const { data: jugadoresData } = await supabase
        .from("profiles")
        .select("*")
        .eq("equipo_id", equipoData.id);
    }

    // Cargar jugadores libres
    const { data: libresData } = await supabase
      .from("profiles")
      .select("*")
      .eq("libre", true)
      .limit(5);

    jugadoresLibres.value = libresData || [];

    // Cargar próximos partidos
    const { data: partidosData } = await supabase
      .from("partidos")
      .select(
        "*, equipo_local:equipos!partidos_equipo_local_id_fkey(nombre), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre)",
      )
      .or(
        `equipo_local_id.eq.${equipoData?.id},equipo_visitante_id.eq.${equipoData?.id}`,
      )
      .order("fecha")
      .limit(3);

    proximosPartidos.value = partidosData || [];
  } catch (e) {
    // Datos de ejemplo
    equipo.value = { id: 1, nombre: "Los Tigres", color_principal: "#164bf0" };
    jugadoresLibres.value = [
      { id: 1, nombre: "Alejandro Sánchez", posicion: "Portero" },
      { id: 2, nombre: "Bruno López", posicion: "Ala" },
    ];
    proximosPartidos.value = [
      {
        id: 1,
        fecha: "2024-03-15T18:00:00",
        lugar: "Polideportivo Municipal",
        equipo_local: { nombre: "Los Tigres" },
        equipo_visitante: { nombre: "Águilas FC" },
      },
    ];
  } finally {
    loading.value = false;
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
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Panel de Capitán</h1>
      <p class="page-subtitle">Gestiona tu equipo y ficha nuevos jugadores</p>
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
            class="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
            :style="{ backgroundColor: equipo?.color_principal || '#164bf0' }"
          >
            {{ equipo?.nombre?.charAt(0) || "?" }}
          </div>
          <div>
            <h2 class="text-xl font-semibold text-notion-text">
              {{ equipo?.nombre || "Sin equipo" }}
            </h2>
            <p class="text-sm text-notion-muted">Tu equipo actual</p>
          </div>
          <div class="ml-auto">
            <router-link to="/capitan/equipo" class="btn-primary">
              Gestionar Equipo
            </router-link>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Jugadores Libres -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-notion-text">
              Jugadores Libres
            </h3>
            <router-link
              to="/jugadores-libres"
              class="text-sm text-primary hover:underline"
            >
              Ver todos
            </router-link>
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
              <button class="btn-outline text-xs py-1 px-3">Fichar</button>
            </div>
            <div
              v-if="jugadoresLibres.length === 0"
              class="text-center py-4 text-notion-muted text-sm"
            >
              No hay jugadores libres disponibles
            </div>
          </div>
        </div>

        <!-- Próximos Partidos -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-notion-text">
              Próximos Partidos
            </h3>
            <router-link
              to="/calendario"
              class="text-sm text-primary hover:underline"
            >
              Ver calendario
            </router-link>
          </div>
          <div class="space-y-3">
            <div
              v-for="partido in proximosPartidos"
              :key="partido.id"
              class="p-4 bg-notion-bg rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-notion-muted">{{
                  formatDate(partido.fecha)
                }}</span>
                <span class="text-xs text-notion-muted">{{
                  partido.lugar
                }}</span>
              </div>
              <div class="flex items-center justify-center space-x-4">
                <span class="font-medium text-notion-text">{{
                  partido.equipo_local?.nombre
                }}</span>
                <span class="text-notion-muted">vs</span>
                <span class="font-medium text-notion-text">{{
                  partido.equipo_visitante?.nombre
                }}</span>
              </div>
            </div>
            <div
              v-if="proximosPartidos.length === 0"
              class="text-center py-4 text-notion-muted text-sm"
            >
              No hay partidos programados
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
