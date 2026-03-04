<script setup>
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";

const secciones = [
  {
    titulo: "Objetivos de la Organización",
    icono: TrophyIcon,
    contenido: [
      "Fomentar la práctica del fútbol sala entre jóvenes de La Vall d'Uixó",
      "Crear un ambiente de respeto, compañerismo y fair play",
      "Facilitar la organización de partidos y competiciones",
      "Promover valores deportivos y personales en todos los participantes",
    ],
  },
  {
    titulo: "Estructura de los Equipos",
    icono: UserGroupIcon,
    contenido: [
      "Cada equipo debe tener un mínimo de 5 jugadores y un máximo de 12",
      "Es obligatorio designar un capitán que será el interlocutor con la organización",
      "Los equipos deben tener un nombre y colores distintivos",
      "Los jugadores pueden cambiar de equipo solo en periodos de fichajes establecidos",
    ],
  },
  {
    titulo: "Desarrollo de los Partidos",
    icono: BookOpenIcon,
    contenido: [
      "Los partidos tendrán una duración de 40 minutos (2 tiempos de 20 min)",
      "Se aplicarán las reglas oficiales de fútbol sala de la RFEF",
      "Es obligatorio presentar el DNI antes de cada partido",
      "Los equipos deben presentarse con 15 minutos de antelación",
    ],
  },
  {
    titulo: "Sanciones y Penalizaciones",
    icono: ClipboardDocumentCheckIcon,
    contenido: [
      "La acumulación de 5 tarjetas amarillas implica 1 partido de sanción",
      "La tarjeta roja directa conlleva 1-3 partidos de sanción según gravedad",
      "Actitudes antideportivas pueden derivar en expulsión de la organización",
      "Las reclamaciones deben presentarse por escrito en un plazo de 48 horas",
    ],
  },
];

const reglasBasicas = [
  "El campo de juego será el designado por la organización para cada partido",
  "El balón será proporcionado por la organización o el equipo local",
  "Los jugadores deben llevar calzado adecuado para superficie dura",
  "No está permitido el uso de joyas, relojes u objetos que puedan causar lesiones",
  "Los cambios son ilimitados y se realizan por la zona de cambios",
  "El portero puede tocar el balón con las manos dentro del área",
];
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Reglamento Oficial</h1>
      <p class="page-subtitle">
        Normas y reglas que rigen los partidos y la organización de FutSal La
        Vall
      </p>
    </div>

    <!-- Secciones principales -->
    <div class="space-y-8">
      <div v-for="seccion in secciones" :key="seccion.titulo" class="card p-6">
        <div class="flex items-start space-x-4">
          <div
            class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0"
          >
            <component :is="seccion.icono" class="w-6 h-6 text-primary" />
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-notion-text mb-4">
              {{ seccion.titulo }}
            </h2>
            <ul class="space-y-2">
              <li
                v-for="(item, index) in seccion.contenido"
                :key="index"
                class="flex items-start space-x-2"
              >
                <span
                  class="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"
                ></span>
                <span class="text-notion-muted">{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Reglas básicas -->
    <div class="mt-8 card p-6">
      <h2 class="text-xl font-semibold text-notion-text mb-4">
        Reglas Básicas de Juego
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="(regla, index) in reglasBasicas"
          :key="index"
          class="flex items-start space-x-3 p-3 bg-notion-bg rounded-lg"
        >
          <span
            class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
          >
            {{ index + 1 }}
          </span>
          <span class="text-sm text-notion-text">{{ regla }}</span>
        </div>
      </div>
    </div>

    <!-- Nota importante -->
    <div class="mt-8 p-6 bg-secondary/10 rounded-xl border border-secondary/20">
      <h3 class="font-semibold text-notion-text mb-2">Nota Importante</h3>
      <p class="text-sm text-notion-muted">
        Este reglamento puede ser modificado por la organización en cualquier
        momento. Los cambios serán comunicados a todos los equipos inscritos con
        al menos 7 días de antelación a su entrada en vigor. Es responsabilidad
        de cada jugador y capitán estar al día de las normas.
      </p>
    </div>

    <!-- Descarga PDF -->
    <div class="mt-8 text-center">
      <p class="text-sm text-notion-muted mb-4">
        ¿Quieres tener el reglamento siempre a mano?
      </p>
      <button class="btn-outline">📄 Descargar PDF del Reglamento</button>
    </div>
  </div>
</template>
