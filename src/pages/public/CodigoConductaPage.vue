<script setup>
import { ref } from "vue";
import {
  HeartIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  HandThumbUpIcon,
} from "@heroicons/vue/24/outline";

const principios = [
  {
    titulo: "Respeto al Rival",
    descripcion:
      "Trata a los jugadores del equipo contrario como te gustaría que te trataran. Sin insultos, sin agresiones, solo deporte.",
    icono: HeartIcon,
  },
  {
    titulo: "Respeto al Árbitro",
    descripcion:
      "Las decisiones del árbitro son inapelables. Cualquier reclamación debe hacerse por los canales oficiales después del partido.",
    icono: ShieldCheckIcon,
  },
  {
    titulo: "Fair Play",
    descripcion:
      "Juega limpio. No simules faltas, no intentes lesionar a nadie. La victoria sin honor no es victoria.",
    icono: HandThumbUpIcon,
  },
  {
    titulo: "Compañerismo",
    descripcion:
      "Apoya a tus compañeros, tanto en los aciertos como en los errores. Un equipo unido es más fuerte.",
    icono: HeartIcon,
  },
];

const prohibiciones = [
  "Insultos o lenguaje ofensivo hacia cualquier persona",
  "Agresiones físicas o amenazas",
  "Discriminación por raza, género, religión u orientación sexual",
  "Amenazas o intimidaciones dentro o fuera del campo",
  "Daños intencionados a las instalaciones",
  "Uso de sustancias prohibidas antes o durante los partidos",
  "Abandonar el campo sin autorización durante un partido",
  "Falsificación de documentos o identidad",
];

const consecuencias = [
  {
    nivel: "Leve",
    sancion: "Amonestación verbal o escrita",
    color: "badge-warning",
  },
  {
    nivel: "Moderada",
    sancion: "1-3 partidos de suspensión",
    color: "badge-secondary",
  },
  {
    nivel: "Grave",
    sancion: "4-10 partidos de suspensión",
    color: "badge-danger",
  },
  {
    nivel: "Muy Grave",
    sancion: "Expulsión definitiva de la organización",
    color: "badge-danger",
  },
];

const tabs = [
  { id: "principios", label: "Principios", icon: HeartIcon },
  { id: "prohibiciones", label: "Prohibiciones", icon: ExclamationTriangleIcon },
  { id: "sanciones", label: "Sanciones", icon: ShieldCheckIcon },
  { id: "compromiso", label: "Compromiso", icon: HandThumbUpIcon },
];

const activeTab = ref("principios");
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Código de Conducta</h1>
      <p class="page-subtitle">
        Normas de comportamiento para mantener un ambiente de respeto y
        convivencia
      </p>
    </div>

    <!-- Introducción -->
    <div class="card p-6 mb-8">
      <p class="text-notion-muted leading-relaxed">
        En <strong class="text-notion-text">FutSal La Vall</strong> creemos que
        el deporte es mucho más que competir. Es una oportunidad para crecer
        como personas, hacer amigos y aprender valores. Este código de conducta
        establece las normas de comportamiento que todos los participantes deben
        respetar para garantizar una experiencia positiva para todos.
      </p>
    </div>

    <!-- Sticky Tab Navigation -->
    <div class="sticky top-16 z-20 bg-notion-card border-b border-notion-border shadow-sm">
      <div class="page-container py-0">
        <div class="flex gap-1 overflow-x-auto scrollbar-hide">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-notion-muted border-transparent hover:text-notion-text hover:border-notion-border',
            ]"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :aria-controls="`panel-${tab.id}`"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="mt-6 relative min-h-80">
      <Transition name="tab-fade" mode="out-in">
        <!-- Principios Tab -->
        <div v-if="activeTab === 'principios'" :key="activeTab" role="tabpanel" id="panel-principios">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="principio in principios"
              :key="principio.titulo"
              class="card p-6"
            >
              <div class="flex items-start space-x-4">
                <div
                  class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <component :is="principio.icono" class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-notion-text mb-2">
                    {{ principio.titulo }}
                  </h3>
                  <p class="text-sm text-notion-muted">{{ principio.descripcion }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Prohibiciones Tab -->
        <div v-else-if="activeTab === 'prohibiciones'" :key="activeTab" role="tabpanel" id="panel-prohibiciones" class="card p-6">
          <div class="flex items-center space-x-3 mb-4">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-500" />
            <h2 class="text-xl font-semibold text-notion-text">
              Conductas Prohibidas
            </h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="(prohibicion, index) in prohibiciones"
              :key="index"
              class="flex items-center space-x-2 p-3 bg-red-50 rounded-lg"
            >
              <span class="text-red-500">✕</span>
              <span class="text-sm text-notion-text">{{ prohibicion }}</span>
            </div>
          </div>
        </div>

        <!-- Sanciones Tab -->
        <div v-else-if="activeTab === 'sanciones'" :key="activeTab" role="tabpanel" id="panel-sanciones" class="card p-6">
          <h2 class="text-xl font-semibold text-notion-text mb-4">
            Sistema de Sanciones
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-notion-border">
                  <th
                    class="text-left py-3 px-4 text-sm font-medium text-notion-muted"
                  >
                    Gravedad
                  </th>
                  <th
                    class="text-left py-3 px-4 text-sm font-medium text-notion-muted"
                  >
                    Sanción
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="consecuencia in consecuencias"
                  :key="consecuencia.nivel"
                  class="border-b border-notion-border last:border-0"
                >
                  <td class="py-3 px-4">
                    <span :class="consecuencia.color">{{
                      consecuencia.nivel
                    }}</span>
                  </td>
                  <td class="py-3 px-4 text-sm text-notion-text">
                    {{ consecuencia.sancion }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Compromiso Tab -->
        <div v-else-if="activeTab === 'compromiso'" :key="activeTab" role="tabpanel" id="panel-compromiso" class="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <h3 class="font-semibold text-notion-text mb-3">Nuestro Compromiso</h3>
          <p class="text-sm text-notion-muted mb-4">
            Al registrarte en FutSal La Vall, aceptas cumplir con este código de
            conducta. El incumplimiento de estas normas puede resultar en sanciones
            proporcionales a la gravedad de la falta. La organización se compromete
            a aplicar estas normas de manera justa e imparcial.
          </p>
          <div class="flex items-center space-x-2 text-sm text-primary">
            <ShieldCheckIcon class="w-5 h-5" />
            <span
              >Todos los participantes tienen derecho a presentar alegaciones ante
              cualquier sanción</span
            >
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.tab-fade-enter-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.tab-fade-leave-active {
  transition: opacity 100ms ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tab-fade-leave-to {
  opacity: 0;
}
</style>
