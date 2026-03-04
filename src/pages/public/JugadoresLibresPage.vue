<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { UserIcon } from "@heroicons/vue/24/outline";

const jugadores = ref([]);
const loading = ref(true);
const error = ref(null);
const filtroPosicion = ref("");

const posiciones = ["Portero", "Defensa", "Ala", "Cierre", "Universal"];

// Función para obtener la ruta de la foto del jugador
const getJugadorFotoPath = (id) => {
  return `/images/jugadores/jugador-${id}.jpg`;
};

// Función para manejar error de imagen
const handleImageError = (event) => {
  // Ocultar imagen con error
  event.target.style.opacity = "0";
  // Mostrar el placeholder (siguiente elemento hermano)
  const placeholder = event.target.nextElementSibling;
  if (placeholder && placeholder.classList.contains("absolute")) {
    placeholder.style.display = "flex";
  }
};

onMounted(async () => {
  try {
    const { data, err } = await supabase
      .from("profiles")
      .select("*")
      .eq("libre", true)
      .order("nombre");

    if (err) throw err;
    jugadores.value = data || [];
  } catch (e) {
    error.value = "Error al cargar los jugadores";
    console.error(e);
  } finally {
    loading.value = false;
  }
});

// Datos de ejemplo
const jugadoresEjemplo = [
  {
    id: 1,
    nombre: "Alejandro Sánchez",
    posicion: "Portero",
    numero_camiseta: 1,
    equipo_id: null,
  },
  {
    id: 2,
    nombre: "Bruno Martínez",
    posicion: "Ala",
    numero_camiseta: 7,
    equipo_id: null,
  },
  {
    id: 3,
    nombre: "David Ruiz",
    posicion: "Cierre",
    numero_camiseta: 4,
    equipo_id: null,
  },
  {
    id: 4,
    nombre: "Fernando López",
    posicion: "Universal",
    numero_camiseta: 10,
    equipo_id: null,
  },
  {
    id: 5,
    nombre: "Gabriel Torres",
    posicion: "Defensa",
    numero_camiseta: 3,
    equipo_id: null,
  },
  {
    id: 6,
    nombre: "Hugo Navarro",
    posicion: "Ala",
    numero_camiseta: 11,
    equipo_id: null,
  },
];

const jugadoresFiltrados = () => {
  const lista = jugadores.value.length > 0 ? jugadores.value : jugadoresEjemplo;
  if (!filtroPosicion.value) return lista;
  return lista.filter((j) => j.posicion === filtroPosicion.value);
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Jugadores Libres</h1>
      <p class="page-subtitle">
        Jugadores disponibles que buscan equipo. ¿Tienes un equipo? ¡Fíchalos!
      </p>
    </div>

    <!-- Filtros -->
    <div class="mb-6 flex flex-wrap gap-2">
      <button
        @click="filtroPosicion = ''"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
          filtroPosicion === ''
            ? 'bg-primary text-white'
            : 'bg-white border border-notion-border text-notion-muted hover:bg-notion-bg',
        ]"
      >
        Todos
      </button>
      <button
        v-for="pos in posiciones"
        :key="pos"
        @click="filtroPosicion = pos"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
          filtroPosicion === pos
            ? 'bg-primary text-white'
            : 'bg-white border border-notion-border text-notion-muted hover:bg-notion-bg',
        ]"
      >
        {{ pos }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Jugadores Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <div
        v-for="jugador in jugadoresFiltrados()"
        :key="jugador.id"
        class="card overflow-hidden group hover:shadow-lg transition-all duration-300"
      >
        <!-- Imagen del jugador - Área dedicada -->
        <div
          class="relative w-full aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden"
        >
          <img
            :src="getJugadorFotoPath(jugador.id)"
            :alt="`Foto de ${jugador.nombre}`"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            @error="handleImageError"
          />
          <!-- Placeholder si no hay imagen -->
          <div
            class="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center"
            style="display: none"
          >
            <UserIcon class="w-16 h-16 text-primary/40" />
          </div>

          <!-- Número de camiseta sobre la imagen -->
          <div
            class="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md"
          >
            <span class="text-sm font-bold text-primary"
              >#{{ jugador.numero_camiseta || "?" }}</span
            >
          </div>

          <!-- Badge de posición sobre la imagen -->
          <div class="absolute bottom-3 left-3">
            <span
              class="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-notion-text shadow-md"
            >
              {{ jugador.posicion || "Sin posición" }}
            </span>
          </div>
        </div>

        <!-- Información del jugador - Área dedicada con fondo opaco -->
        <div class="p-5 bg-white">
          <!-- Nombre del jugador -->
          <h3 class="font-semibold text-lg text-notion-text mb-3 truncate">
            {{ jugador.nombre }}
          </h3>

          <!-- Estado -->
          <div class="flex items-center gap-2 mb-4">
            <span
              class="inline-flex items-center gap-1.5 text-xs text-green-600"
            >
              <span
                class="w-2 h-2 bg-green-500 rounded-full animate-pulse"
              ></span>
              Disponible para fichar
            </span>
          </div>

          <!-- Acción -->
          <button
            class="btn-primary w-full text-sm py-2.5 group-hover:bg-primary-600"
          >
            Solicitar fichaje
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && jugadoresFiltrados().length === 0"
      class="text-center py-12"
    >
      <UserIcon class="w-16 h-16 text-notion-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-notion-text mb-2">
        No hay jugadores libres con ese filtro
      </h3>
      <p class="text-notion-muted">
        Prueba a seleccionar otra posición o revisa más tarde
      </p>
    </div>

    <!-- Info para capitanes -->
    <div class="mt-8 p-6 bg-secondary/10 rounded-xl border border-secondary/20">
      <h3 class="font-semibold text-notion-text mb-2">
        ¿Eres capitán de un equipo?
      </h3>
      <p class="text-sm text-notion-muted mb-4">
        Si tienes un equipo registrado, puedes fichar jugadores libres desde tu
        panel de capitán. Los jugadores recibirán una solicitud que podrán
        aceptar o rechazar.
      </p>
      <router-link to="/login" class="btn-primary text-sm">
        Acceder al panel
      </router-link>
    </div>
  </div>
</template>
