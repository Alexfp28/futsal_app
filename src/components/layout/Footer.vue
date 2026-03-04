<script setup>
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="bg-white border-t border-notion-border mt-auto">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Logo y descripción -->
        <div>
          <div class="flex items-center gap-3 mb-4">
            <img
              src="/logo.svg"
              alt="FutSal La Vall"
              class="w-8 h-8 rounded-lg object-contain"
            />
            <span class="font-semibold text-notion-text">FutSal La Vall</span>
          </div>
          <p class="text-sm text-notion-muted">
            Organización dedicada a concretar partidos de fútbol sala entre
            jugadores jóvenes, fomentando el deporte, la amistad y los valores.
          </p>
        </div>

        <!-- Enlaces rápidos -->
        <div>
          <h3 class="font-semibold text-notion-text mb-4">Enlaces Rápidos</h3>
          <ul class="space-y-2">
            <li>
              <router-link
                to="/equipos"
                class="text-sm text-notion-muted hover:text-primary transition-colors whitespace-nowrap"
              >
                Equipos
              </router-link>
            </li>
            <li>
              <router-link
                to="/calendario"
                class="text-sm text-notion-muted hover:text-primary transition-colors whitespace-nowrap"
              >
                Calendario
              </router-link>
            </li>
            <li>
              <router-link
                to="/reglamento"
                class="text-sm text-notion-muted hover:text-primary transition-colors whitespace-nowrap"
              >
                Reglamento
              </router-link>
            </li>
            <li>
              <router-link
                to="/economia"
                class="text-sm text-notion-muted hover:text-primary transition-colors whitespace-nowrap"
              >
                Transparencia
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Contacto -->
        <div>
          <h3 class="font-semibold text-notion-text mb-4">Contacto</h3>
          <ul class="space-y-2 text-sm text-notion-muted">
            <li>📍 La Vall d'Uixó, Castellón</li>
            <li>📧 info@futsallavall.es</li>
            <li>📱 Redes sociales próximamente</li>
          </ul>
        </div>
      </div>

      <div class="border-t border-notion-border mt-8 pt-6 text-center">
        <p class="text-sm text-notion-muted">
          © {{ currentYear }} FutSal La Vall. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
</template>
