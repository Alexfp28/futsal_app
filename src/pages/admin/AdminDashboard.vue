<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  UsersIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyEuroIcon,
} from "@heroicons/vue/24/outline";

const stats = ref({
  equipos: 0,
  jugadores: 0,
  partidos: 0,
  gastos: 0,
});

const loading = ref(true);

const loadStats = async () => {
  loading.value = true;
  try {
    // Cargar estadísticas
    const [equiposRes, jugadoresRes, partidosRes, gastosRes] =
      await Promise.all([
        supabase.from("equipos").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("partidos").select("id", { count: "exact" }),
        supabase.from("gastos").select("importe"),
      ]);

    stats.value = {
      equipos: equiposRes.count || 0,
      jugadores: jugadoresRes.count || 0,
      partidos: partidosRes.count || 0,
      gastos:
        gastosRes.data?.reduce((sum, g) => sum + Number(g.importe), 0) || 0,
    };
  } catch (e) {
    // Datos de ejemplo si no hay conexión
    stats.value = {
      equipos: 6,
      jugadores: 48,
      partidos: 12,
      gastos: 2030,
    };
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStats();
});

useRouteRefresh(loadStats);

const quickActions = [
  {
    name: "Gestionar Equipos",
    href: "/admin/equipos",
    icon: UserGroupIcon,
    color: "bg-primary/10 text-primary",
  },
  {
    name: "Gestionar Jugadores",
    href: "/admin/jugadores",
    icon: UsersIcon,
    color: "bg-secondary/20 text-notion-text",
  },
  {
    name: "Gestionar Partidos",
    href: "/admin/partidos",
    icon: CalendarIcon,
    color: "bg-tertiary/20 text-tertiary",
  },
  {
    name: "Gestionar Gastos",
    href: "/admin/gastos",
    icon: CurrencyEuroIcon,
    color: "bg-green-100 text-green-600",
  },
];
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Panel de Administrador</h1>
      <p class="page-subtitle">Gestiona todos los aspectos de FutSal La Vall</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-notion-muted">Equipos</p>
            <p class="text-2xl font-bold text-notion-text">
              {{ stats.equipos }}
            </p>
          </div>
          <div
            class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"
          >
            <UserGroupIcon class="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-notion-muted">Jugadores</p>
            <p class="text-2xl font-bold text-notion-text">
              {{ stats.jugadores }}
            </p>
          </div>
          <div
            class="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center"
          >
            <UsersIcon class="w-5 h-5 text-notion-text" />
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-notion-muted">Partidos</p>
            <p class="text-2xl font-bold text-notion-text">
              {{ stats.partidos }}
            </p>
          </div>
          <div
            class="w-10 h-10 bg-tertiary/20 rounded-lg flex items-center justify-center"
          >
            <CalendarIcon class="w-5 h-5 text-tertiary" />
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-notion-muted">Gastos</p>
            <p class="text-2xl font-bold text-notion-text">
              {{ stats.gastos }}€
            </p>
          </div>
          <div
            class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
          >
            <CurrencyEuroIcon class="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <h2 class="text-lg font-semibold text-notion-text mb-4">
      Acciones Rápidas
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <router-link
        v-for="action in quickActions"
        :key="action.name"
        :to="action.href"
        class="card p-6 hover:shadow-notion-hover transition-shadow group"
      >
        <div class="flex items-center space-x-4">
          <div
            :class="[
              'w-12 h-12 rounded-lg flex items-center justify-center',
              action.color,
            ]"
          >
            <component :is="action.icon" class="w-6 h-6" />
          </div>
          <div>
            <h3
              class="font-medium text-notion-text group-hover:text-primary transition-colors"
            >
              {{ action.name }}
            </h3>
            <p class="text-sm text-notion-muted">Administrar</p>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Recent Activity -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold text-notion-text mb-4">
        Actividad Reciente
      </h2>
      <div class="space-y-4">
        <div class="flex items-center space-x-4 p-3 bg-notion-bg rounded-lg">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <p class="text-sm text-notion-text">
            Nuevo equipo registrado: <strong>Atlético Vall</strong>
          </p>
          <span class="text-xs text-notion-muted ml-auto">Hace 2 horas</span>
        </div>
        <div class="flex items-center space-x-4 p-3 bg-notion-bg rounded-lg">
          <div class="w-2 h-2 bg-primary rounded-full"></div>
          <p class="text-sm text-notion-text">
            Partido programado: <strong>Los Tigres vs Águilas FC</strong>
          </p>
          <span class="text-xs text-notion-muted ml-auto">Hace 5 horas</span>
        </div>
        <div class="flex items-center space-x-4 p-3 bg-notion-bg rounded-lg">
          <div class="w-2 h-2 bg-secondary rounded-full"></div>
          <p class="text-sm text-notion-text">
            Nuevo jugador registrado: <strong>Carlos García</strong>
          </p>
          <span class="text-xs text-notion-muted ml-auto">Hace 1 día</span>
        </div>
      </div>
    </div>
  </div>
</template>
