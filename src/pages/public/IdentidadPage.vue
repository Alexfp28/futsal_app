<script setup>
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  SparklesIcon,
  UsersIcon,
  TrophyIcon,
  HeartIcon,
  CalendarIcon,
  ChartBarIcon,
  UserPlusIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();

// Datos dinámicos
const loading = ref(true);
const stats = ref({ equipos: 0, jugadores: 0, partidos: 0 });
const proximosPartidos = ref([]);
const clasificacion = ref([]);
const jugadoresLibres = ref([]);

// Cargar datos al montar
onMounted(async () => {
  try {
    // Cargar estadísticas
    const [equiposRes, jugadoresRes, partidosRes] = await Promise.all([
      supabase.from("equipos").select("id", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("partidos").select("id", { count: "exact" }),
    ]);

    stats.value = {
      equipos: equiposRes.count || 0,
      jugadores: jugadoresRes.count || 0,
      partidos: partidosRes.count || 0,
    };

    // Cargar próximos partidos (próximos 5 partidos programados)
    const { data: partidosData } = await supabase
      .from("partidos")
      .select(
        "*, equipo_local:equipos!partidos_equipo_local_id_fkey(id, nombre, escudo_url), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(id, nombre, escudo_url)",
      )
      .eq("estado", "programado")
      .gte("fecha", new Date().toISOString())
      .order("fecha")
      .limit(5);

    proximosPartidos.value = partidosData || [];

    // Cargar clasificación
    const { data: clasificacionData } = await supabase
      .from("clasificacion")
      .select("*")
      .order("posicion")
      .limit(5);

    clasificacion.value = clasificacionData || [];

    // Cargar jugadores libres (primeros 4)
    const { data: jugadoresData } = await supabase
      .from("jugadores_libres")
      .select("*")
      .limit(4);

    jugadoresLibres.value = jugadoresData || [];
  } catch (e) {
    console.error("Error cargando datos:", e);
    // Usar valores por defecto
    stats.value = { equipos: 12, jugadores: 85, partidos: 156 };
  } finally {
    loading.value = false;
  }
});

// Formatear fecha
const formatFecha = (fecha) => {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Obtener nivel como estrellas
const getEstrellas = (nivel) => {
  if (!nivel) return [];
  return Array.from({ length: 5 }, (_, i) => i < nivel);
};
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative bg-primary text-white py-20 overflow-hidden">
      <!-- Imagen de fondo difuminada -->
      <div
        class="absolute inset-0 bg-cover bg-center opacity-80"
        style="background-image: url(&quot;/images/header_logo.jpeg&quot;)"
      ></div>
      <!-- Overlay del gradiente para asegurar legibilidad -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-700/90"
      ></div>

      <div class="page-container text-center relative z-10">
        <div class="max-w-3xl mx-auto">
          <div
            class="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-6"
          >
            <img
              src="/logo.svg"
              alt="FutSal La Vall"
              class="w-16 h-16 object-contain"
            />
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-6">FutSal La Vall</h1>
          <p class="text-xl text-white/90 mb-8">
            La organización que conecta a jóvenes apasionados por el fútbol sala
            en La Vall d'Uixó
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/registro"
              class="btn-secondary text-base px-6 py-3"
            >
              Únete a nosotros
            </router-link>
            <router-link
              to="/equipos"
              class="btn-outline bg-white/10 border-white/30 text-white hover:bg-white/20 text-base px-6 py-3"
            >
              Ver equipos
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Misión Section -->
    <section class="py-16 bg-white">
      <div class="page-container">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-3xl font-bold text-notion-text mb-6">
            Nuestra Misión
          </h2>
          <p class="text-lg text-notion-muted leading-relaxed">
            FutSal La Vall nace con el objetivo de
            <strong class="text-notion-text"
              >facilitar y organizar partidos de fútbol sala</strong
            >
            entre jugadores jóvenes de nuestra localidad. Queremos crear una
            comunidad donde todos puedan disfrutar del deporte, mejorar sus
            habilidades y hacer nuevas amistades.
          </p>
        </div>
      </div>
    </section>

    <!-- Valores Section -->
    <section class="py-16 bg-notion-bg">
      <div class="page-container">
        <h2 class="text-3xl font-bold text-notion-text mb-12 text-center">
          Nuestros Valores
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Deporte -->
          <div class="card p-6 text-center">
            <div
              class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4"
            >
              <TrophyIcon class="w-6 h-6 text-primary" />
            </div>
            <h3 class="font-semibold text-notion-text mb-2">Deporte</h3>
            <p class="text-sm text-notion-muted">
              Fomentamos la práctica deportiva como herramienta de salud y
              bienestar.
            </p>
          </div>

          <!-- Comunidad -->
          <div class="card p-6 text-center">
            <div
              class="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4"
            >
              <UsersIcon class="w-6 h-6 text-notion-text" />
            </div>
            <h3 class="font-semibold text-notion-text mb-2">Comunidad</h3>
            <p class="text-sm text-notion-muted">
              Creamos lazos entre jóvenes que comparten la misma pasión por el
              fútbol sala.
            </p>
          </div>

          <!-- Respeto -->
          <div class="card p-6 text-center">
            <div
              class="w-12 h-12 bg-tertiary/20 rounded-xl flex items-center justify-center mx-auto mb-4"
            >
              <HeartIcon class="w-6 h-6 text-tertiary" />
            </div>
            <h3 class="font-semibold text-notion-text mb-2">Respeto</h3>
            <p class="text-sm text-notion-muted">
              El respeto entre compañeros y rivales es fundamental en cada
              partido.
            </p>
          </div>

          <!-- Diversión -->
          <div class="card p-6 text-center">
            <div
              class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4"
            >
              <SparklesIcon class="w-6 h-6 text-primary" />
            </div>
            <h3 class="font-semibold text-notion-text mb-2">Diversión</h3>
            <p class="text-sm text-notion-muted">
              Disfrutar jugando es lo más importante. Sin presión, solo pasión.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Estadísticas Section -->
    <section class="py-16 bg-white">
      <div class="page-container">
        <h2 class="text-3xl font-bold text-notion-text mb-12 text-center">
          ¿Qué ofrecemos?
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">
              {{ loading ? "..." : stats.jugadores }}
            </div>
            <p class="text-notion-muted">Jugadores registrados</p>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">
              {{ loading ? "..." : stats.equipos }}
            </div>
            <p class="text-notion-muted">Equipos activos</p>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">
              {{ loading ? "..." : stats.partidos }}
            </div>
            <p class="text-notion-muted">Partidos organizados</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Próximos Partidos Section -->
    <section class="py-16 bg-notion-bg">
      <div class="page-container">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-notion-text">Próximos Partidos</h2>
          <router-link
            to="/calendario"
            class="flex items-center gap-1 text-primary hover:text-primary-600 font-medium"
          >
            Ver todos <ArrowRightIcon class="w-4 h-4" />
          </router-link>
        </div>
        <div
          v-if="proximosPartidos.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="partido in proximosPartidos"
            :key="partido.id"
            class="card p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-notion-muted flex items-center gap-1">
                <ClockIcon class="w-3 h-3" />
                {{ formatFecha(partido.fecha) }}
              </span>
              <span
                class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
              >
                Programado
              </span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 flex-1">
                <div
                  class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
                >
                  {{ partido.equipo_local?.nombre?.charAt(0) || "L" }}
                </div>
                <span class="font-medium text-notion-text text-sm truncate">
                  {{ partido.equipo_local?.nombre || "Local" }}
                </span>
              </div>
              <span class="text-notion-muted text-xs mx-2">vs</span>
              <div class="flex items-center gap-2 flex-1 justify-end">
                <span class="font-medium text-notion-text text-sm truncate">
                  {{ partido.equipo_visitante?.nombre || "Visitante" }}
                </span>
                <div
                  class="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-notion-text"
                >
                  {{ partido.equipo_visitante?.nombre?.charAt(0) || "V" }}
                </div>
              </div>
            </div>
            <div v-if="partido.lugar" class="mt-2 text-xs text-notion-muted">
              📍 {{ partido.lugar }}
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-notion-muted">
          <CalendarIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay partidos programados actualmente</p>
        </div>
      </div>
    </section>

    <!-- Clasificación Section -->
    <section class="py-16 bg-white">
      <div class="page-container">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-notion-text">Clasificación</h2>
          <router-link
            to="/calendario"
            class="flex items-center gap-1 text-primary hover:text-primary-600 font-medium"
          >
            Ver clasificación completa <ArrowRightIcon class="w-4 h-4" />
          </router-link>
        </div>
        <div v-if="clasificacion.length > 0" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-notion-border">
                <th class="text-left py-3 px-4 font-semibold text-notion-muted">
                  Pos
                </th>
                <th class="text-left py-3 px-4 font-semibold text-notion-muted">
                  Equipo
                </th>
                <th
                  class="text-center py-3 px-4 font-semibold text-notion-muted"
                >
                  PJ
                </th>
                <th
                  class="text-center py-3 px-4 font-semibold text-notion-muted"
                >
                  G
                </th>
                <th
                  class="text-center py-3 px-4 font-semibold text-notion-muted"
                >
                  E
                </th>
                <th
                  class="text-center py-3 px-4 font-semibold text-notion-muted"
                >
                  P
                </th>
                <th
                  class="text-center py-3 px-4 font-semibold text-notion-muted"
                >
                  GF
                </th>
                <th
                  class="text-center py-3 px-4 font-semibold text-notion-muted"
                >
                  GC
                </th>
                <th
                  class="text-center py-3 px-4 font-semibold text-notion-muted"
                >
                  DG
                </th>
                <th
                  class="text-center py-3 px-4 font-semibold text-notion-text"
                >
                  PTS
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="equipo in clasificacion"
                :key="equipo.id"
                class="border-b border-notion-border/50 hover:bg-notion-bg transition-colors"
              >
                <td class="py-3 px-4">
                  <span
                    :class="[
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                      equipo.posicion === 1
                        ? 'bg-yellow-400 text-yellow-900'
                        : equipo.posicion === 2
                          ? 'bg-gray-300 text-gray-700'
                          : equipo.posicion === 3
                            ? 'bg-orange-300 text-orange-900'
                            : 'bg-notion-bg text-notion-muted',
                    ]"
                  >
                    {{ equipo.posicion }}
                  </span>
                </td>
                <td class="py-3 px-4 font-medium text-notion-text">
                  {{ equipo.nombre }}
                </td>
                <td class="py-3 px-4 text-center text-notion-muted">
                  {{ equipo.partidos_jugados || 0 }}
                </td>
                <td class="py-3 px-4 text-center text-notion-muted">
                  {{ equipo.ganados || 0 }}
                </td>
                <td class="py-3 px-4 text-center text-notion-muted">
                  {{ equipo.empatados || 0 }}
                </td>
                <td class="py-3 px-4 text-center text-notion-muted">
                  {{ equipo.perdidos || 0 }}
                </td>
                <td class="py-3 px-4 text-center text-notion-muted">
                  {{ equipo.gf || 0 }}
                </td>
                <td class="py-3 px-4 text-center text-notion-muted">
                  {{ equipo.gc || 0 }}
                </td>
                <td class="py-3 px-4 text-center text-notion-muted">
                  {{ equipo.dg || 0 }}
                </td>
                <td class="py-3 px-4 text-center font-bold text-primary">
                  {{ equipo.pts || 0 }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 text-notion-muted">
          <ChartBarIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay clasificación disponible</p>
        </div>
      </div>
    </section>

    <!-- Jugadores Libres Section -->
    <section class="py-16 bg-notion-bg">
      <div class="page-container">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-notion-text">Jugadores Libres</h2>
          <router-link
            to="/jugadores-libres"
            class="flex items-center gap-1 text-primary hover:text-primary-600 font-medium"
          >
            Ver todos <ArrowRightIcon class="w-4 h-4" />
          </router-link>
        </div>
        <div
          v-if="jugadoresLibres.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div
            v-for="jugador in jugadoresLibres"
            :key="jugador.id"
            class="card p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"
              >
                {{ jugador.nombre?.charAt(0) || "J" }}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-notion-text truncate">
                  {{ jugador.nombre }}
                </h4>
                <p class="text-xs text-notion-muted">{{ jugador.posicion }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span v-if="jugador.edad" class="text-notion-muted"
                >{{ jugador.edad }} años</span
              >
              <div v-if="jugador.nivel" class="flex items-center gap-0.5">
                <span
                  v-for="(filled, idx) in getEstrellas(jugador.nivel)"
                  :key="idx"
                  :class="filled ? 'text-yellow-400' : 'text-gray-300'"
                  class="w-3 h-3"
                  >★</span
                >
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-notion-muted">
          <UsersIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay jugadores libres actualmente</p>
        </div>
      </div>
    </section>

    <!-- CTAs Section -->
    <section
      class="py-16 bg-gradient-to-br from-primary to-primary-700 text-white"
    >
      <div class="page-container text-center">
        <h2 class="text-3xl font-bold mb-4">¿Listo para jugar?</h2>
        <p class="text-white/90 mb-8 max-w-2xl mx-auto">
          Únete a nuestra comunidad y empieza a disfrutar del fútbol sala con
          otros jóvenes de La Vall d'Uixó.
        </p>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          <router-link
            to="/calendario"
            class="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <CalendarIcon class="w-8 h-8" />
            <span class="font-medium">Ver Calendario</span>
          </router-link>
          <router-link
            to="/calendario"
            class="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <ChartBarIcon class="w-8 h-8" />
            <span class="font-medium">Ver Clasificación</span>
          </router-link>
          <router-link
            to="/registro"
            class="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <UserPlusIcon class="w-8 h-8" />
            <span class="font-medium">Apuntarme como Jugador</span>
          </router-link>
          <router-link
            to="/registro"
            class="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <PlusCircleIcon class="w-8 h-8" />
            <span class="font-medium">Crear Equipo</span>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>
