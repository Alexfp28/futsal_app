<script setup>
import {
  SparklesIcon,
  UsersIcon,
  TrophyIcon,
  HeartIcon,
} from "@heroicons/vue/24/outline";
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

    <!-- Qué ofrecemos Section -->
    <section class="py-16 bg-white">
      <div class="page-container">
        <h2 class="text-3xl font-bold text-notion-text mb-12 text-center">
          ¿Qué ofrecemos?
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">+50</div>
            <p class="text-notion-muted">Jugadores registrados</p>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">+10</div>
            <p class="text-notion-muted">Equipos activos</p>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">+100</div>
            <p class="text-notion-muted">Partidos organizados</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-primary text-white">
      <div class="page-container text-center">
        <h2 class="text-3xl font-bold mb-4">¿Listo para jugar?</h2>
        <p class="text-white/90 mb-8 max-w-2xl mx-auto">
          Únete a nuestra comunidad y empieza a disfrutar del fútbol sala con
          otros jóvenes de La Vall d'Uixó. Puedes registrarte como jugador libre
          o crear tu propio equipo.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/registro" class="btn-secondary text-base px-8 py-3">
            Registrarme ahora
          </router-link>
          <router-link
            to="/reglamento"
            class="btn-outline bg-white/10 border-white/30 text-white hover:bg-white/20 text-base px-8 py-3"
          >
            Ver reglamento
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>
