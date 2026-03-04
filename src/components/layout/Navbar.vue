<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const authStore = useAuthStore();

const isMenuOpen = ref(false);
const isUserMenuOpen = ref(false);

const navigation = [
  { name: "Identidad", href: "/identidad" },
  { name: "Equipos", href: "/equipos" },
  { name: "Jugadores Libres", href: "/jugadores-libres" },
  { name: "Reglamento", href: "/reglamento" },
  { name: "Código de Conducta", href: "/codigo-conducta" },
  { name: "Economía", href: "/economia" },
  { name: "Calendario", href: "/calendario" },
];

const userMenuItems = computed(() => {
  const items = [];

  if (authStore.isAuthenticated) {
    items.push({ name: "Mi Perfil", href: "/perfil" });

    if (authStore.isAdmin) {
      items.push({ name: "Panel Admin", href: "/admin" });
    }

    if (authStore.isCapitan || authStore.isAdmin) {
      items.push({ name: "Mi Equipo", href: "/capitan/equipo" });
    }
  }

  return items;
});

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

const handleLogout = async () => {
  await authStore.logout();
  isUserMenuOpen.value = false;
  router.push("/");
};

const closeMenu = () => {
  isMenuOpen.value = false;
};
</script>

<template>
  <nav class="bg-white border-b border-notion-border sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center flex-shrink-0">
          <router-link
            to="/"
            class="flex items-center gap-3"
            @click="closeMenu"
          >
            <img
              src="/images/logo.jpeg"
              alt="FutSal La Vall"
              class="w-10 h-10 rounded-lg object-contain"
              @error="$event.target.style.display = 'none'"
            />
            <span
              class="font-semibold text-lg text-notion-text hidden sm:block whitespace-nowrap"
            >
              FutSal La Vall
            </span>
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="px-3 py-2 text-sm font-medium text-notion-muted hover:text-notion-text hover:bg-notion-bg rounded-lg transition-colors whitespace-nowrap"
            active-class="text-primary bg-primary-50"
          >
            {{ item.name }}
          </router-link>
        </div>

        <!-- User Menu / Auth Buttons -->
        <div class="hidden lg:flex items-center gap-4">
          <template v-if="authStore.isAuthenticated">
            <div class="relative">
              <button
                @click="toggleUserMenu"
                class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-notion-text hover:bg-notion-bg rounded-lg transition-colors"
              >
                <UserCircleIcon class="w-6 h-6 text-primary" />
                <span class="hidden xl:inline whitespace-nowrap">{{
                  authStore.userName
                }}</span>
              </button>

              <!-- Dropdown -->
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-notion-border py-1"
              >
                <router-link
                  v-for="item in userMenuItems"
                  :key="item.name"
                  :to="item.href"
                  class="block px-4 py-2 text-sm text-notion-text hover:bg-notion-bg whitespace-nowrap"
                  @click="isUserMenuOpen = false"
                >
                  {{ item.name }}
                </router-link>
                <hr class="my-1 border-notion-border" />
                <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <router-link
              to="/login"
              class="px-4 py-2 text-sm font-medium text-notion-text hover:bg-notion-bg rounded-lg transition-colors whitespace-nowrap"
            >
              Iniciar Sesión
            </router-link>
            <router-link
              to="/registro"
              class="btn-primary text-sm whitespace-nowrap"
            >
              Registrarse
            </router-link>
          </template>
        </div>

        <!-- Mobile menu button -->
        <div class="lg:hidden flex items-center">
          <button
            @click="toggleMenu"
            class="p-2 text-notion-text hover:bg-notion-bg rounded-lg"
          >
            <Bars3Icon v-if="!isMenuOpen" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div
      v-if="isMenuOpen"
      class="lg:hidden bg-white border-t border-notion-border"
    >
      <div class="px-4 py-3 space-y-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="block px-3 py-2 text-sm font-medium text-notion-muted hover:text-notion-text hover:bg-notion-bg rounded-lg whitespace-nowrap"
          active-class="text-primary bg-primary-50"
          @click="closeMenu"
        >
          {{ item.name }}
        </router-link>
      </div>

      <div class="px-4 py-3 border-t border-notion-border">
        <template v-if="authStore.isAuthenticated">
          <div class="flex items-center gap-2 mb-3">
            <UserCircleIcon class="w-6 h-6 text-primary" />
            <span class="text-sm font-medium">{{ authStore.userName }}</span>
            <span class="badge badge-primary text-xs">{{
              authStore.userRole
            }}</span>
          </div>
          <router-link
            v-for="item in userMenuItems"
            :key="item.name"
            :to="item.href"
            class="block px-3 py-2 text-sm text-notion-text hover:bg-notion-bg rounded-lg whitespace-nowrap"
            @click="closeMenu"
          >
            {{ item.name }}
          </router-link>
          <button
            @click="handleLogout"
            class="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mt-2"
          >
            Cerrar Sesión
          </button>
        </template>
        <template v-else>
          <router-link
            to="/login"
            class="block px-3 py-2 text-sm font-medium text-notion-text hover:bg-notion-bg rounded-lg"
            @click="closeMenu"
          >
            Iniciar Sesión
          </router-link>
          <router-link
            to="/registro"
            class="block px-3 py-2 text-sm font-medium text-primary hover:bg-primary-50 rounded-lg"
            @click="closeMenu"
          >
            Registrarse
          </router-link>
        </template>
      </div>
    </div>
  </nav>
</template>
