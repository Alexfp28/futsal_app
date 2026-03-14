<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const isAuthenticated = authStore.isAuthenticated;

const traspasos = ref([]);
const loading = ref(true);

const estados = {
  pendiente: { label: "Pendiente", color: "text-yellow-600", icon: ClockIcon },
  confirmado: {
    label: "Confirmado",
    color: "text-green-600",
    icon: CheckCircleIcon,
  },
  cancelado: { label: "Cancelado", color: "text-red-600", icon: XCircleIcon },
};

const loadTraspasos = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("traspasos")
      .select(
        `
        *,
        jugador:profiles(nombre, posicion),
        equipo_origen:equipos!traspasos_equipo_origen_id_fkey(nombre),
        equipo_destino:equipos!traspasos_equipo_destino_id_fkey(nombre)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    traspasos.value = data || [];
  } catch (e) {
    console.error("Error cargando traspasos:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadTraspasos();
});

// Recargar datos cuando se navega a esta ruta
useRouteRefresh(loadTraspasos);

const traspasosEjemplo = [
  {
    id: "ejemplo-1",
    jugador: { nombre: "Carlos Ruiz", posicion: "Ala" },
    equipo_origen: { nombre: "Los Tigres" },
    equipo_destino: { nombre: "Águilas FC" },
    estado: "confirmado",
    created_at: "2024-12-15",
  },
  {
    id: "ejemplo-2",
    jugador: { nombre: "Miguel Torres", posicion: "Cierre" },
    equipo_origen: { nombre: "La Vall United" },
    equipo_destino: { nombre: "Atlético Vall" },
    estado: "pendiente",
    created_at: "2025-01-10",
  },
];
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Mercado de Fichajes</h1>
      <p class="page-subtitle">
        Seguimiento de los traspasos y cambios de equipo
      </p>
    </div>

    <!-- Aviso -->
    <div class="card p-4 mb-6 bg-yellow-50 border border-yellow-200">
      <p class="text-sm text-yellow-800">
        📢 El mercado de fichajes está cerrado. Esta sección mostrará los
        movimientos de jugadores cuando se abra la próxima ventana de traspasos.
      </p>
    </div>

    <!-- Lista de traspasos -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold text-notion-text mb-4">
        Historial de traspasos
      </h2>

      <div v-if="loading" class="flex justify-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        ></div>
      </div>

      <div
        v-else-if="traspasos.length === 0"
        class="text-center py-8 text-notion-muted"
      >
        <ArrowRightIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No hay traspasos registrados</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="tras in traspasos.length > 0 ? traspasos : traspasosEjemplo"
          :key="tras.id"
          class="p-4 bg-notion-bg rounded-lg flex items-center justify-between"
        >
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="font-medium text-notion-text">
                {{ tras.jugador?.nombre || "Jugador" }}
              </span>
              <span class="text-xs text-notion-muted">
                ({{ tras.jugador?.posicion }})
              </span>
            </div>

            <div class="flex items-center gap-2 text-sm">
              <span class="text-notion-muted">{{
                tras.equipo_origen?.nombre || "Equipo origen"
              }}</span>
              <ArrowRightIcon class="w-4 h-4 text-primary" />
              <span class="text-notion-muted">{{
                tras.equipo_destino?.nombre || "Equipo destino"
              }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <component
              :is="estados[tras.estado]?.icon || ClockIcon"
              :class="[
                'w-4 h-4',
                estados[tras.estado]?.color || 'text-gray-400',
              ]"
            />
            <span
              :class="[
                'text-sm font-medium',
                estados[tras.estado]?.color || 'text-gray-400',
              ]"
            >
              {{ estados[tras.estado]?.label || tras.estado }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
