<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { useScrollReveal } from "@/composables/useScrollReveal";
import { useCountUp } from "@/composables/useCountUp";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
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
const imageErrors = ref({});

// Animaciones
const { observe, isVisible } = useScrollReveal({ threshold: 0.12 });
const heroMounted = ref(false);
const statsTriggered = ref(false);

// Contadores animados
const countJugadores = useCountUp(
  computed(() => (statsTriggered.value ? stats.value.jugadores : 0))
);
const countEquipos = useCountUp(
  computed(() => (statsTriggered.value ? stats.value.equipos : 0))
);
const countPartidos = useCountUp(
  computed(() => (statsTriggered.value ? stats.value.partidos : 0))
);

// Cargar datos al montar
const loadIdentidad = async () => {
  loading.value = true;
  imageErrors.value = {};
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
        "*, equipo_local:equipos!partidos_equipo_local_id_fkey(id, nombre, escudo_url, color_principal), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(id, nombre, escudo_url, color_principal)"
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
    // Animar hero
    await nextTick();
    setTimeout(() => {
      heroMounted.value = true;
    }, 80);
  }
};

onMounted(() => {
  loadIdentidad();
});

useRouteRefresh(loadIdentidad);

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

const getEquipoLogo = (equipo) => equipo?.logo_url || equipo?.escudo_url || null;

const hasEquipoLogo = (equipo) =>
  Boolean(getEquipoLogo(equipo)) && !imageErrors.value[equipo?.id];

const handleImageError = (equipoId) => {
  if (!equipoId) return;

  imageErrors.value = {
    ...imageErrors.value,
    [equipoId]: true,
  };
};

// Activar contadores cuando la sección es visible
watch(() => isVisible('stats'), (visible) => {
  if (visible && !statsTriggered.value) {
    statsTriggered.value = true;
  }
});
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section
      class="relative min-h-screen bg-gradient-to-b from-[#0a1a5c] via-primary-900/90 to-primary-700/80 text-white flex items-center overflow-hidden"
    >
      <!-- SVG Pattern de cancha de fútbol -->
      <svg
        class="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="court"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <rect width="80" height="80" fill="none" stroke="white" stroke-width="0.5" />
            <circle cx="40" cy="40" r="20" fill="none" stroke="white" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#court)" />
      </svg>

      <!-- Blur orbs decorativos -->
      <div
        class="absolute -top-20 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute -bottom-10 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
      ></div>

      <!-- Floating stat cards (desktop) -->
      <div
        class="hidden lg:block absolute left-8 top-1/3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 text-center animate-float"
      >
        <div class="text-3xl font-black text-secondary">
          {{ loading ? "..." : stats.equipos }}
        </div>
        <div class="text-xs text-white/70 mt-1 uppercase tracking-wider font-semibold">
          Equipos
        </div>
      </div>

      <div
        class="hidden lg:block absolute right-12 top-2/3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 text-center animate-float-delayed"
      >
        <div class="text-3xl font-black text-primary-200">
          {{ loading ? "..." : stats.partidos }}
        </div>
        <div class="text-xs text-white/70 mt-1 uppercase tracking-wider font-semibold">
          Partidos
        </div>
      </div>

      <!-- Contenido principal del hero -->
      <div class="page-container relative z-10 flex items-center min-h-screen">
        <div class="max-w-4xl mx-auto w-full text-center">
          <!-- Eyebrow -->
          <p
            class="text-secondary/90 font-semibold text-sm uppercase tracking-[0.3em] mb-6 transition-all duration-700 delay-100"
            :class="
              heroMounted
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-4'
            "
          >
            La Vall d'Uixó · Temporada 2025–26
          </p>

          <!-- Título principal -->
          <div class="mb-8">
            <h1
              class="text-6xl md:text-7xl lg:text-8xl font-black leading-none transition-all duration-700 delay-200"
              :class="
                heroMounted
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              "
            >
              FutSal
            </h1>
            <h1
              class="text-6xl md:text-7xl lg:text-8xl font-black leading-none text-secondary transition-all duration-700 delay-300"
              :class="
                heroMounted
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              "
            >
              La Vall
            </h1>
          </div>

          <!-- Tagline -->
          <p
            class="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto transition-all duration-700 delay-300"
            :class="
              heroMounted
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            "
          >
            La organización que conecta a jóvenes apasionados por el fútbol sala
            en La Vall d'Uixó
          </p>

          <!-- CTAs -->
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-400"
            :class="
              heroMounted
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            "
          >
            <router-link
              to="/registro"
              class="group inline-flex items-center justify-center gap-2 bg-secondary text-notion-text font-bold px-8 py-4 rounded-2xl text-base hover:bg-secondary-400 hover:shadow-[0_0_30px_rgba(246,236,21,0.4)] transition-all duration-300 hover:-translate-y-0.5"
            >
              Únete Ahora
              <ArrowRightIcon
                class="w-5 h-5 group-hover:translate-x-1 transition-transform"
              />
            </router-link>
            <router-link
              to="/equipos"
              class="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl text-base hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
            >
              Ver Equipos
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Misión Section -->
    <section
      :ref="(el) => observe(el, 'mision')"
      class="py-24 bg-white transition-all duration-700 ease-out"
      :class="
        isVisible('mision')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      "
    >
      <div class="page-container">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center">
          <!-- Columna texto -->
          <div class="max-w-2xl">
            <div class="section-eyebrow">
              <span class="w-8 h-0.5 bg-primary"></span>
              Nuestra Misión
            </div>
            <h2 class="text-4xl lg:text-5xl font-bold text-notion-text leading-tight mb-6">
              Fútbol sala<br />
              <span class="text-primary">para todos.</span>
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

          <!-- Columna decorativa: mini-stats -->
          <div class="hidden lg:flex flex-col gap-4 lg:w-56">
            <div class="bg-notion-bg rounded-2xl p-5 border border-notion-border/60">
              <div class="text-2xl font-bold text-primary">100%</div>
              <div class="text-xs text-notion-muted mt-1">Gratuito</div>
            </div>
            <div class="bg-notion-bg rounded-2xl p-5 border border-notion-border/60">
              <div class="text-2xl font-bold text-primary">+500</div>
              <div class="text-xs text-notion-muted mt-1">Jugadores Activos</div>
            </div>
            <div class="bg-notion-bg rounded-2xl p-5 border border-notion-border/60">
              <div class="text-2xl font-bold text-primary">24/7</div>
              <div class="text-xs text-notion-muted mt-1">Acceso Plataforma</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Valores Section (Glassmorphism) -->
    <section
      :ref="(el) => observe(el, 'valores')"
      class="py-24 bg-[#0d1b4b] relative overflow-hidden transition-all duration-700 ease-out"
      :class="
        isVisible('valores')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      "
    >
      <!-- Blur orb decorativo -->
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[80px]"
      ></div>

      <div class="page-container relative z-10">
        <div class="text-center mb-16">
          <div class="section-eyebrow justify-center text-white/70">
            <span class="w-8 h-0.5 bg-white/30"></span>
            Nuestros Valores
            <span class="w-8 h-0.5 bg-white/30"></span>
          </div>
          <h2 class="text-4xl font-bold text-white mt-4">
            Lo que nos define
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Deporte -->
          <div
            :style="{ transitionDelay: '0ms' }"
            class="card-glass p-8 text-center group transition-all duration-700 ease-out"
            :class="
              isVisible('valores')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            "
          >
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-primary/20 border border-primary/30 group-hover:bg-primary/40 group-hover:border-primary/60 group-hover:shadow-[0_0_20px_rgba(22,75,240,0.4)] transition-all duration-300"
            >
              <TrophyIcon class="w-7 h-7 text-primary-300" />
            </div>
            <h3 class="font-bold text-white text-lg mb-2">Deporte</h3>
            <p class="text-white/60 text-sm leading-relaxed">
              Fomentamos la práctica deportiva como herramienta de salud y
              bienestar.
            </p>
          </div>

          <!-- Comunidad -->
          <div
            :style="{ transitionDelay: '100ms' }"
            class="card-glass p-8 text-center group transition-all duration-700 ease-out"
            :class="
              isVisible('valores')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            "
          >
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-secondary/20 border border-secondary/30 group-hover:bg-secondary/40 group-hover:border-secondary/60 group-hover:shadow-[0_0_20px_rgba(246,236,21,0.4)] transition-all duration-300"
            >
              <UsersIcon class="w-7 h-7 text-secondary-300" />
            </div>
            <h3 class="font-bold text-white text-lg mb-2">Comunidad</h3>
            <p class="text-white/60 text-sm leading-relaxed">
              Creamos lazos entre jóvenes que comparten la misma pasión por el
              fútbol sala.
            </p>
          </div>

          <!-- Respeto -->
          <div
            :style="{ transitionDelay: '200ms' }"
            class="card-glass p-8 text-center group transition-all duration-700 ease-out"
            :class="
              isVisible('valores')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            "
          >
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-tertiary/20 border border-tertiary/30 group-hover:bg-tertiary/40 group-hover:border-tertiary/60 group-hover:shadow-[0_0_20px_rgba(112,140,197,0.4)] transition-all duration-300"
            >
              <HeartIcon class="w-7 h-7 text-tertiary-300" />
            </div>
            <h3 class="font-bold text-white text-lg mb-2">Respeto</h3>
            <p class="text-white/60 text-sm leading-relaxed">
              El respeto entre compañeros y rivales es fundamental en cada
              partido.
            </p>
          </div>

          <!-- Diversión -->
          <div
            :style="{ transitionDelay: '300ms' }"
            class="card-glass p-8 text-center group transition-all duration-700 ease-out"
            :class="
              isVisible('valores')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            "
          >
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-primary/20 border border-primary/30 group-hover:bg-primary/40 group-hover:border-primary/60 group-hover:shadow-[0_0_20px_rgba(22,75,240,0.4)] transition-all duration-300"
            >
              <SparklesIcon class="w-7 h-7 text-primary-300" />
            </div>
            <h3 class="font-bold text-white text-lg mb-2">Diversión</h3>
            <p class="text-white/60 text-sm leading-relaxed">
              Disfrutar jugando es lo más importante. Sin presión, solo pasión.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Estadísticas Section (contadores animados) -->
    <section
      :ref="(el) => observe(el, 'stats')"
      class="py-24 bg-gradient-to-b from-primary-50/60 to-white transition-all duration-700 ease-out"
      :class="
        isVisible('stats')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      "
    >
      <div class="page-container">
        <div class="text-center mb-16">
          <span class="text-primary font-semibold text-sm uppercase tracking-[0.25em]">
            En números
          </span>
          <h2 class="text-4xl font-bold text-notion-text mt-4">
            ¿Qué ofrecemos?
          </h2>
        </div>

        <!-- Stats row con separadores -->
        <div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-notion-border/60">
          <!-- Jugadores -->
          <div class="flex-1 text-center py-8 px-8">
            <div
              class="text-6xl lg:text-7xl font-black text-primary leading-none tabular-nums mb-3"
            >
              {{ countJugadores.displayValue }}
            </div>
            <div class="text-xs font-semibold uppercase tracking-widest text-notion-muted">
              Jugadores Registrados
            </div>
          </div>

          <!-- Equipos -->
          <div class="flex-1 text-center py-8 px-8">
            <div
              class="text-6xl lg:text-7xl font-black text-primary leading-none tabular-nums mb-3"
            >
              {{ countEquipos.displayValue }}
            </div>
            <div class="text-xs font-semibold uppercase tracking-widest text-notion-muted">
              Equipos Activos
            </div>
          </div>

          <!-- Partidos -->
          <div class="flex-1 text-center py-8 px-8">
            <div
              class="text-6xl lg:text-7xl font-black text-primary leading-none tabular-nums mb-3"
            >
              {{ countPartidos.displayValue }}
            </div>
            <div class="text-xs font-semibold uppercase tracking-widest text-notion-muted">
              Partidos Organizados
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Próximos Partidos Section -->
    <section
      :ref="(el) => observe(el, 'partidos')"
      class="py-24 bg-white transition-all duration-700 ease-out"
      :class="
        isVisible('partidos')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      "
    >
      <div class="page-container">
        <div class="flex items-center justify-between mb-12">
          <div>
            <span class="section-eyebrow">
              <span class="w-8 h-0.5 bg-primary"></span>
              Próximos Partidos
            </span>
            <h2 class="text-4xl font-bold text-notion-text">Próxima acción</h2>
          </div>
          <router-link
            to="/rankings"
            class="flex items-center gap-1 text-primary hover:text-primary-600 font-semibold"
          >
            Ver todos <ArrowRightIcon class="w-4 h-4" />
          </router-link>
        </div>

        <div
          v-if="proximosPartidos.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div
            v-for="(partido, i) in proximosPartidos"
            :key="partido.id"
            :style="{ transitionDelay: `${i * 75}ms` }"
            class="group relative bg-white rounded-2xl border border-notion-border/60 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(22,75,240,0.12)] overflow-hidden transition-all duration-300 hover:-translate-y-1"
          >
            <!-- Barra de acento superior -->
            <div
              class="h-1 bg-gradient-to-r from-primary via-primary-400 to-tertiary"
            ></div>

            <div class="p-5">
              <!-- Badge y fecha -->
              <div class="flex justify-between items-center mb-4">
                <span class="text-xs text-notion-muted flex items-center gap-1.5">
                  <ClockIcon class="w-3.5 h-3.5" />
                  {{ formatFecha(partido.fecha) }}
                </span>
                <span
                  class="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold"
                >
                  Programado
                </span>
              </div>

              <!-- Layout equipos -->
              <div class="flex items-center gap-3">
                <!-- Equipo local -->
                <div class="flex-1 flex flex-col items-center gap-2">
                  <img
                    v-if="hasEquipoLogo(partido.equipo_local)"
                    :src="getEquipoLogo(partido.equipo_local)"
                    :alt="`Escudo de ${partido.equipo_local?.nombre || 'Equipo local'}`"
                    class="w-12 h-12 rounded-full object-cover bg-white border-2 border-primary/20 group-hover:border-primary/50 transition-colors duration-300"
                    @error="handleImageError(partido.equipo_local?.id)"
                  />
                  <div
                    v-else
                    class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white border-2 border-primary/20 group-hover:border-primary/50 transition-colors duration-300"
                    :style="{
                      backgroundColor:
                        partido.equipo_local?.color_principal || '#164bf0',
                    }"
                  >
                    {{ partido.equipo_local?.nombre?.charAt(0) || "L" }}
                  </div>
                  <span class="text-sm font-semibold text-notion-text text-center leading-tight">
                    {{ partido.equipo_local?.nombre || "Local" }}
                  </span>
                </div>

                <!-- VS central -->
                <div class="flex flex-col items-center gap-1 flex-shrink-0">
                  <span class="text-xs font-black text-notion-muted uppercase tracking-wider"
                    >vs</span
                  >
                </div>

                <!-- Equipo visitante -->
                <div class="flex-1 flex flex-col items-center gap-2">
                  <img
                    v-if="hasEquipoLogo(partido.equipo_visitante)"
                    :src="getEquipoLogo(partido.equipo_visitante)"
                    :alt="`Escudo de ${partido.equipo_visitante?.nombre || 'Equipo visitante'}`"
                    class="w-12 h-12 rounded-full object-cover bg-white border-2 border-secondary/30 group-hover:border-secondary/60 transition-colors duration-300"
                    @error="handleImageError(partido.equipo_visitante?.id)"
                  />
                  <div
                    v-else
                    class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-notion-text border-2 border-secondary/30 group-hover:border-secondary/60 transition-colors duration-300"
                    :style="{
                      backgroundColor:
                        partido.equipo_visitante?.color_principal || '#f6ec15',
                    }"
                  >
                    {{ partido.equipo_visitante?.nombre?.charAt(0) || "V" }}
                  </div>
                  <span class="text-sm font-semibold text-notion-text text-center leading-tight">
                    {{ partido.equipo_visitante?.nombre || "Visitante" }}
                  </span>
                </div>
              </div>

              <!-- Ubicación -->
              <div
                v-if="partido.lugar"
                class="mt-4 pt-3 border-t border-notion-border/50 text-xs text-notion-muted flex items-center gap-1.5"
              >
                <span>📍</span> {{ partido.lugar }}
              </div>
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
    <section
      :ref="(el) => observe(el, 'clasificacion')"
      class="py-24 bg-notion-bg transition-all duration-700 ease-out"
      :class="
        isVisible('clasificacion')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      "
    >
      <div class="page-container">
        <div class="flex items-center justify-between mb-12">
          <div>
            <span class="section-eyebrow">
              <span class="w-8 h-0.5 bg-primary"></span>
              Posiciones
            </span>
            <h2 class="text-4xl font-bold text-notion-text">Clasificación</h2>
          </div>
          <router-link
            to="/calendario"
            class="flex items-center gap-1 text-primary hover:text-primary-600 font-semibold"
          >
            Ver completa <ArrowRightIcon class="w-4 h-4" />
          </router-link>
        </div>

        <div v-if="clasificacion.length > 0" class="overflow-x-auto rounded-2xl border border-notion-border">
          <table class="w-full text-sm bg-white">
            <thead>
              <tr class="bg-notion-bg border-b border-notion-border">
                <th class="text-left py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  Pos
                </th>
                <th class="text-left py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  Equipo
                </th>
                <th class="text-center py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  PJ
                </th>
                <th class="text-center py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  G
                </th>
                <th class="text-center py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  E
                </th>
                <th class="text-center py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  P
                </th>
                <th class="text-center py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  GF
                </th>
                <th class="text-center py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  GC
                </th>
                <th class="text-center py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  DG
                </th>
                <th class="text-center py-4 px-4 font-bold text-notion-text uppercase text-xs tracking-wider">
                  PTS
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="equipo in clasificacion"
                :key="equipo.id"
                :class="[
                  'border-b border-notion-border/50 hover:bg-primary-50/30 transition-colors',
                  equipo.posicion === 1
                    ? 'bg-yellow-50/80'
                    : equipo.posicion === 2
                      ? 'bg-gray-50'
                      : equipo.posicion === 3
                        ? 'bg-orange-50/80'
                        : ''
                ]"
              >
                <td class="py-4 px-4">
                  <span
                    :class="[
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black',
                      equipo.posicion === 1
                        ? 'bg-yellow-400 text-yellow-900'
                        : equipo.posicion === 2
                          ? 'bg-gray-300 text-gray-700'
                          : equipo.posicion === 3
                            ? 'bg-orange-300 text-orange-900'
                            : 'bg-notion-bg text-notion-muted'
                    ]"
                  >
                    {{ equipo.posicion }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <img
                      v-if="hasEquipoLogo(equipo)"
                      :src="getEquipoLogo(equipo)"
                      :alt="`Escudo de ${equipo.nombre}`"
                      class="w-9 h-9 rounded-full object-cover border border-notion-border bg-white shrink-0"
                      @error="handleImageError(equipo.id)"
                    />
                    <div
                      v-else
                      class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      :style="{
                        backgroundColor: equipo.color_principal || '#164bf0',
                      }"
                    >
                      {{ equipo.nombre?.charAt(0) || "E" }}
                    </div>
                    <span class="font-semibold text-notion-text">
                      {{ equipo.nombre }}
                    </span>
                  </div>
                </td>
                <td class="py-4 px-4 text-center text-notion-muted">
                  {{ equipo.partidos_jugados || 0 }}
                </td>
                <td class="py-4 px-4 text-center text-notion-muted">
                  {{ equipo.ganados || 0 }}
                </td>
                <td class="py-4 px-4 text-center text-notion-muted">
                  {{ equipo.empatados || 0 }}
                </td>
                <td class="py-4 px-4 text-center text-notion-muted">
                  {{ equipo.perdidos || 0 }}
                </td>
                <td class="py-4 px-4 text-center text-notion-muted">
                  {{ equipo.gf || 0 }}
                </td>
                <td class="py-4 px-4 text-center text-notion-muted">
                  {{ equipo.gc || 0 }}
                </td>
                <td class="py-4 px-4 text-center text-notion-muted">
                  {{ equipo.dg || 0 }}
                </td>
                <td class="py-4 px-4 text-center font-black text-primary text-base">
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
    <section
      :ref="(el) => observe(el, 'jugadores')"
      class="py-24 bg-white transition-all duration-700 ease-out"
      :class="
        isVisible('jugadores')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      "
    >
      <div class="page-container">
        <div class="flex items-center justify-between mb-12">
          <div>
            <span class="section-eyebrow">
              <span class="w-8 h-0.5 bg-primary"></span>
              Disponibles
            </span>
            <h2 class="text-4xl font-bold text-notion-text">Jugadores Libres</h2>
          </div>
          <router-link
            to="/jugadores-libres"
            class="flex items-center gap-1 text-primary hover:text-primary-600 font-semibold"
          >
            Ver todos <ArrowRightIcon class="w-4 h-4" />
          </router-link>
        </div>

        <div
          v-if="jugadoresLibres.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div
            v-for="(jugador, i) in jugadoresLibres"
            :key="jugador.id"
            :style="{ transitionDelay: `${i * 75}ms` }"
            class="group relative bg-white rounded-2xl border border-notion-border/60 hover:border-secondary/60 hover:shadow-[0_8px_25px_rgba(246,236,21,0.15)] p-5 transition-all duration-300 hover:-translate-y-1"
          >
            <!-- Avatar con gradiente -->
            <div
              class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white text-xl font-bold mb-4 group-hover:shadow-[0_0_20px_rgba(22,75,240,0.35)] transition-shadow duration-300"
            >
              {{ jugador.nombre?.charAt(0) || "J" }}
            </div>

            <!-- Nombre y posición -->
            <h4 class="font-bold text-notion-text">{{ jugador.nombre }}</h4>
            <p class="text-xs text-notion-muted mt-0.5">{{ jugador.posicion }}</p>

            <!-- Estrellas y edad -->
            <div
              class="flex items-center justify-between mt-3 pt-3 border-t border-notion-border/50"
            >
              <span v-if="jugador.edad" class="text-xs text-notion-muted">
                {{ jugador.edad }} años
              </span>
              <div v-if="jugador.nivel" class="flex gap-0.5">
                <span
                  v-for="(filled, idx) in getEstrellas(jugador.nivel)"
                  :key="idx"
                  :class="
                    filled
                      ? 'text-secondary drop-shadow-[0_0_3px_rgba(246,236,21,0.8)]'
                      : 'text-gray-200'
                  "
                  class="text-base"
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

    <!-- CTA Final Section -->
    <section
      :ref="(el) => observe(el, 'cta-final')"
      class="py-24 bg-gradient-to-br from-primary-800 to-primary-600 text-white relative overflow-hidden transition-all duration-700 ease-out"
      :class="
        isVisible('cta-final')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      "
    >
      <!-- Blur orbs decorativos -->
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-400/20 rounded-full blur-[80px]"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[80px]"
      ></div>

      <!-- Contenido -->
      <div class="page-container text-center relative z-10">
        <h2 class="text-4xl lg:text-5xl font-bold mb-4">¿Listo para jugar?</h2>
        <p class="text-white/90 mb-12 max-w-2xl mx-auto text-lg">
          Únete a nuestra comunidad y empieza a disfrutar del fútbol sala con
          otros jóvenes de La Vall d'Uixó.
        </p>

        <!-- Bento Grid de CTAs -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <!-- CTA principal — col-span -->
          <router-link
            to="/registro"
            class="col-span-2 md:col-span-1 md:row-span-2 flex flex-col items-center justify-center gap-3 bg-secondary text-notion-text font-bold rounded-2xl p-8 hover:bg-secondary-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(246,236,21,0.4)]"
          >
            <UserPlusIcon class="w-10 h-10" />
            <span class="text-lg">Apuntarme</span>
            <span class="text-sm font-normal opacity-70">Empieza hoy</span>
          </router-link>

          <!-- Ver Calendario -->
          <router-link
            to="/calendario"
            class="flex flex-col items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
          >
            <CalendarIcon class="w-7 h-7" />
            <span class="text-sm text-center">Ver Calendario</span>
          </router-link>

          <!-- Ver Clasificación -->
          <router-link
            to="/rankings"
            class="flex flex-col items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
          >
            <ChartBarIcon class="w-7 h-7" />
            <span class="text-sm text-center">Clasificación</span>
          </router-link>

          <!-- Crear Equipo -->
          <router-link
            to="/registro"
            class="flex flex-col items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
          >
            <PlusCircleIcon class="w-7 h-7" />
            <span class="text-sm text-center">Crear Equipo</span>
          </router-link>

          <!-- Ver Jugadores Libres -->
          <router-link
            to="/jugadores-libres"
            class="flex flex-col items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
          >
            <UsersIcon class="w-7 h-7" />
            <span class="text-sm text-center">Jugadores Libres</span>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Animaciones personalizadas */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 4s ease-in-out infinite 1.5s;
}
</style>
