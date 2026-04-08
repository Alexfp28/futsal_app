<script setup>
import { ref } from "vue";
import {
  TrophyIcon,
  UserGroupIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  MegaphoneIcon,
  StarIcon,
  ChevronDownIcon,
  EnvelopeIcon,
} from "@heroicons/vue/24/outline";

const secciones = [
  {
    titulo: "1. Objetivo de la competición",
    icono: TrophyIcon,
    contenido: [
      "Fomentar la práctica del fútbol sala en La Vall d'Uixó",
      "Crear un entorno de respeto, compañerismo y fair play",
      "Facilitar la organización de partidos de forma autónoma",
    ],
  },
  {
    titulo: "2. Equipos y organización",
    icono: UserGroupIcon,
    contenido: [
      "Cada equipo tendrá entre 5 y 12 jugadores",
      "Cada equipo contará con un capitán (y opcional segundo capitán)",
      "El capitán es responsable de: registrar el equipo, inscribir y actualizar jugadores, la comunicación con la organización y el comportamiento del equipo",
      "Cada equipo deberá facilitar: nombre del equipo, colores, capitanes e identificación de jugadores",
    ],
  },
  {
    titulo: "3. Gestión de jugadores",
    icono: ClipboardDocumentCheckIcon,
    contenido: [
      "Cada jugador solo podrá participar con un único equipo durante la temporada",
      "Las plantillas estarán abiertas durante toda la competición",
      "Se podrán incorporar nuevos jugadores en cualquier momento, siempre que no hayan participado previamente en otro equipo",
      "Toda incorporación debe ser comunicada y aprobada antes del partido",
      "No se permite la participación de jugadores no registrados",
    ],
  },
  {
    titulo: "Control de participación",
    icono: ShieldCheckIcon,
    contenido: [
      "Solo podrán jugar los jugadores registrados previamente",
      "La alineación indebida supondrá la pérdida del partido",
      "La organización podrá solicitar la identificación de jugadores en cualquier momento",
    ],
  },
  {
    titulo: "4. Normas básicas de juego",
    icono: BookOpenIcon,
    contenido: [
      "No hay fuera de juego",
      "Saques de banda y esquina con el pie",
      "Saque de centro tras gol",
      "Distancia mínima en faltas: 5 metros",
      "Portero: no puede coger con la mano un pase con el pie de un compañero",
      "Portero: puede salir del área y jugar como un jugador más",
      "Portero: puede jugar en campo rival",
      "Solo se señalarán faltas claras. Empujones, zancadillas, manos y juego peligroso serán sancionados",
      "En caso de duda, no se sanciona",
    ],
  },
  {
    titulo: "5. Régimen de arbitraje",
    icono: ScaleIcon,
    contenido: [
      "La competición no dispone de árbitros asignados ni contratados",
      "CON ÁRBITRO (voluntario): Solo si ambos capitanes aceptan antes del partido. Las decisiones del árbitro son finales y no se discuten. No se puede cambiar el régimen una vez iniciado el partido. El árbitro voluntario no representa a la organización",
      "SIN ÁRBITRO (régimen habitual): Partido autogestionado. Los jugadores señalan faltas claras. En caso de conflicto, deciden los capitanes. Si no hay acuerdo, la acción no se sanciona y el juego continúa",
    ],
  },
  {
    titulo: "6. Desarrollo de los partidos",
    icono: ClockIcon,
    contenido: [
      "Duración: 40 minutos (2 partes de 20 minutos)",
      "Los partidos comenzarán y finalizarán según el horario establecido",
      "El tiempo no se recupera bajo ningún concepto",
      "Los equipos deben estar listos a la hora de inicio",
      "Solo podrán participar jugadores previamente registrados",
    ],
  },
  {
    titulo: "7. Jefe de jornada",
    icono: MegaphoneIcon,
    contenido: [
      "No actúa como árbitro",
      "No interviene en decisiones de juego",
      "Solo interviene en caso de conflicto grave o violencia",
      "Puede detener el partido si es necesario",
    ],
  },
  {
    titulo: "8. Incomparecencias",
    icono: ExclamationTriangleIcon,
    contenido: [
      "No presentarse implica derrota por 3-0",
      "La reincidencia podrá suponer sanciones adicionales o expulsión",
    ],
  },
  {
    titulo: "9. Conducta y disciplina",
    icono: HandRaisedIcon,
    contenido: [
      "FutsalVall es una competición sin árbitros. Se exige respeto, honestidad y sentido común",
      "Respeto a rivales y compañeros en todo momento",
      "Prohibidos insultos y agresiones",
      "Los capitanes median en conflictos",
      "Conductas no permitidas: insultos reiterados, agresiones o amenazas, provocar conflictos, intentar aprovecharse de la ausencia de árbitro",
      "Sanciones: advertencia, suspensión o expulsión",
    ],
  },
  {
    titulo: "10. Autoridad",
    icono: ShieldCheckIcon,
    contenido: [
      "La organización tendrá la última palabra en cualquier conflicto",
      "La organización podrá intervenir en situaciones no previstas",
    ],
  },
  {
    titulo: "11. Comunicación",
    icono: EnvelopeIcon,
    contenido: [
      "Toda comunicación oficial se realizará a través de la web",
      "No se gestionarán incidencias por WhatsApp",
      "Canal de contacto oficial para incidencias: futsalvall@gmail.com",
    ],
  },
  {
    titulo: "12. Filosofía de la competición",
    icono: StarIcon,
    contenido: [
      "Se prioriza el respeto, el sentido común y el fair play",
      "El objetivo es jugar, no discutir",
      "Todos los participantes son responsables de que la competición sea un espacio positivo",
    ],
  },
];

const openSection = ref(secciones[0].titulo);

const toggleSection = (titulo) => {
  openSection.value = openSection.value === titulo ? null : titulo;
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Reglamento Oficial</h1>
      <p class="page-subtitle">
        Normas y reglas que rigen los partidos y la organización de FutsalVall
      </p>
    </div>

    <!-- Quick Reference Bar -->
    <div class="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
      <button
        v-for="s in secciones"
        :key="s.titulo"
        @click="openSection = s.titulo"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
          openSection === s.titulo
            ? 'bg-primary text-white border-primary'
            : 'border-notion-border text-notion-muted hover:border-primary/40 hover:text-primary',
        ]"
      >
        <component :is="s.icono" class="w-3.5 h-3.5" />
        {{ s.titulo }}
      </button>
    </div>

    <!-- Accordion Secciones -->
    <div class="space-y-3">
      <div
        v-for="seccion in secciones"
        :key="seccion.titulo"
        class="card overflow-hidden"
      >
        <!-- Accordion Header -->
        <button
          @click="toggleSection(seccion.titulo)"
          :aria-expanded="openSection === seccion.titulo"
          class="w-full flex items-center gap-3 p-4 text-left hover:bg-notion-bg transition-colors"
        >
          <div
            class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <component :is="seccion.icono" class="w-5 h-5 text-primary" />
          </div>
          <span class="flex-1 font-semibold text-notion-text">{{ seccion.titulo }}</span>
          <ChevronDownIcon
            class="w-4 h-4 text-notion-muted transition-transform duration-300"
            :class="{ 'rotate-180': openSection === seccion.titulo }"
            aria-hidden="true"
          />
        </button>

        <!-- Accordion Body -->
        <div
          class="accordion-body"
          :class="{ open: openSection === seccion.titulo }"
        >
          <ul class="px-4 pb-4 pt-1 space-y-2">
            <li
              v-for="(item, index) in seccion.contenido"
              :key="index"
              class="flex items-start gap-2"
            >
              <span class="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
              <span class="text-notion-muted text-sm">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Contacto oficial -->
    <div class="mt-8 p-6 bg-secondary/10 rounded-xl border border-secondary/20">
      <h3 class="font-semibold text-notion-text mb-2">Contacto oficial</h3>
      <p class="text-sm text-notion-muted mb-3">
        Para cualquier incidencia o consulta relacionada con la competición,
        utiliza exclusivamente el correo oficial. No se gestionan incidencias
        por WhatsApp ni por otros canales.
      </p>
      <a
        href="mailto:futsalvall@gmail.com"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-sm"
      >
        <EnvelopeIcon class="w-4 h-4" />
        futsalvall@gmail.com
      </a>
    </div>
  </div>
</template>

<style scoped>
.accordion-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.accordion-body.open {
  max-height: 800px;
}
</style>
