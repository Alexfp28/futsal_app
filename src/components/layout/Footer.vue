<script setup>
import { ref } from "vue";
import { useScrollReveal } from "@/composables/useScrollReveal";
import {
  EnvelopeIcon,
  MapPinIcon,
  HeartIcon,
  ArrowRightIcon,
  EllipsisHorizontalCircleIcon,
} from "@heroicons/vue/24/outline";

const currentYear = new Date().getFullYear();
const { observe, isVisible } = useScrollReveal({ threshold: 0.2 });

// Redes sociales placeholders
const socialLinks = [
  { name: "Instagram", icon: "instagram", href: "#" },
  { name: "TikTok", icon: "tiktok", href: "#" },
  { name: "WhatsApp", icon: "whatsapp", href: "#" },
  { name: "Discord", icon: "discord", href: "#" },
];

const quickLinks = [
  { label: "Equipos", to: "/equipos" },
  { label: "Calendario", to: "/calendario" },
  { label: "Rankings", to: "/rankings" },
  { label: "Reglamento", to: "/reglamento" },
];

const mainLinks = [
  { label: "Palmares", to: "/palmares" },
  { label: "Traspasos", to: "/traspasos" },
  { label: "Código de Conducta", to: "/codigo-conducta" },
  { label: "Identidad", to: "/identidad" },
];
</script>

<template>
  <footer class="relative bg-gradient-to-b from-[#0a1a5c] via-primary-900/90 to-primary-800/80 text-white border-t border-white/10 mt-auto overflow-hidden">
    <!-- Blur orbs decorativos -->
    <div class="absolute -top-40 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-40"></div>
    <div class="absolute -bottom-32 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-30"></div>

    <!-- Contenido principal -->
    <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <!-- Grid principal -->
      <div
        :ref="(el) => observe(el, 'footer-main')"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 transition-all duration-700"
        :class="
          isVisible('footer-main')
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        "
      >
        <!-- Logo & Brand Section -->
        <div class="lg:col-span-1">
          <div class="flex items-center gap-3 mb-4">
            <img
              src="/logo.svg"
              alt="FutSal La Vall"
              class="w-10 h-10 rounded-xl object-contain drop-shadow-lg"
            />
            <div>
              <div class="font-bold text-white text-lg tracking-tight">
                FutSal
              </div>
              <div class="font-semibold text-secondary text-xs">La Vall</div>
            </div>
          </div>
          <p class="text-sm text-white/70 leading-relaxed mb-6">
            Organización dedicada a conectar jóvenes apasionados por el fútbol
            sala.
          </p>

          <!-- Trust badges -->
          <div class="flex gap-2 flex-wrap">
            <div class="px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-xs text-white/60">
              ✓ 100% Gratuito
            </div>
            <div class="px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-xs text-white/60">
              ✓ Justo
            </div>
          </div>
        </div>

        <!-- Enlaces Rápidos -->
        <div>
          <h4 class="font-bold text-white uppercase tracking-wider text-xs mb-5 text-secondary">
            Navegación
          </h4>
          <ul class="space-y-3">
            <li v-for="link in quickLinks" :key="link.to">
              <router-link
                :to="link.to"
                class="text-sm text-white/70 hover:text-secondary transition-colors duration-200 flex items-center gap-2 group"
              >
                <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:bg-secondary transition-colors"></span>
                {{ link.label }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Enlaces Principales -->
        <div>
          <h4 class="font-bold text-white uppercase tracking-wider text-xs mb-5 text-secondary">
            Comunidad
          </h4>
          <ul class="space-y-3">
            <li v-for="link in mainLinks" :key="link.to">
              <router-link
                :to="link.to"
                class="text-sm text-white/70 hover:text-secondary transition-colors duration-200 flex items-center gap-2 group"
              >
                <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:bg-secondary transition-colors"></span>
                {{ link.label }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Contacto -->
        <div>
          <h4 class="font-bold text-white uppercase tracking-wider text-xs mb-5 text-secondary">
            Contacto
          </h4>
          <ul class="space-y-4">
            <li class="flex gap-3 items-start">
              <MapPinIcon class="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
              <div class="text-sm text-white/70">
                La Vall d'Uixó
                <br />
                <span class="text-xs text-white/50">Castellón, España</span>
              </div>
            </li>
            <li class="flex gap-3 items-start">
              <EnvelopeIcon class="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <a
                  href="mailto:futsalvall@gmail.com"
                  class="text-sm text-secondary font-semibold hover:text-secondary-400 transition-colors"
                >
                  futsalvall@gmail.com
                </a>
                <p class="text-xs text-white/45 mt-0.5 leading-snug">
                  Canal oficial para incidencias.<br />No se gestiona por WhatsApp.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Redes Sociales Section -->
      <div
        :ref="(el) => observe(el, 'footer-social')"
        class="border-y border-white/10 py-8 transition-all duration-700"
        :class="
          isVisible('footer-social')
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        "
      >
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-2">
            <HeartIcon class="w-5 h-5 text-secondary" />
            <span class="text-sm font-semibold text-white">
              Síguenos en redes
            </span>
          </div>

          <!-- Social Icons -->
          <div class="flex gap-3">
            <a
              v-for="social in socialLinks"
              :key="social.name"
              :href="social.href"
              :title="social.name"
              class="w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-secondary hover:border-secondary/50 hover:bg-white/10 transition-all duration-300 hover:scale-110"
            >
              <EllipsisHorizontalCircleIcon class="w-5 h-5" />
            </a>
          </div>

          <!-- Newsletter CTA -->
          <router-link
            to="/registro"
            class="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 border border-secondary/30 hover:border-secondary/60 text-secondary font-semibold rounded-lg transition-all duration-300 text-sm"
          >
            Únete ahora
            <ArrowRightIcon class="w-4 h-4" />
          </router-link>
        </div>
      </div>

      <!-- Copyright -->
      <div
        :ref="(el) => observe(el, 'footer-copyright')"
        class="mt-8 pt-8 text-center transition-all duration-700"
        :class="
          isVisible('footer-copyright')
            ? 'opacity-100'
            : 'opacity-0'
        "
      >
        <p class="text-xs text-white/50 mb-2">
          © {{ currentYear }} FutSal La Vall. Todos los derechos reservados.
        </p>
        <p class="text-xs text-white/40">
          Hecho con
          <span class="text-secondary inline-block animate-pulse">♥</span>
          para la comunidad de La Vall d'Uixó
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Smooth gradient overlay effect */
footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
}
</style>
