<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const authStore = useAuthStore();
defineOptions({ name: "Navbar" });

const isMenuOpen = ref(false);
const isUserMenuOpen = ref(false);
const userMenuRef = ref(null);

const navigation = [
  { name: "Panel interno", href: "/intranet", requiresAuth: true },
  { name: "Identidad", href: "/identidad" },
  { name: "Equipos", href: "/equipos" },
  { name: "Rankings", href: "/rankings", hideWhenAuth: true },
  { name: "Palmarés", href: "/palmares" },
  { name: "Traspasos", href: "/traspasos" },
  { name: "Jugadores Libres", href: "/jugadores-libres" },
  { name: "Sugerencias", href: "/sugerencias" },
  { name: "Reglamento", href: "/reglamento" },
  { name: "Código de Conducta", href: "/codigo-conducta" },
  { name: "Economía", href: "/economia" },
  { name: "Invitaciones", href: "/invitaciones", requiresAuth: true },
  // Solo visible para usuarios no autenticados (hay calendario interno)
  { name: "Calendario", href: "/calendario", hideWhenAuth: true },
];

const visibleNavigation = computed(() =>
  navigation.filter(
    (item) =>
      (!item.requiresAuth || authStore.isAuthenticated) &&
      !(item.hideWhenAuth && authStore.isAuthenticated),
  ),
);

const userMenuItems = computed(() => {
  const items = [];

  if (authStore.isAuthenticated) {
    items.push({ name: "Mi Perfil", href: "/perfil" });

    if (authStore.isAdmin) {
      items.push({ name: "Panel Admin", href: "/admin" });
    }

    if (authStore.isCapitan || authStore.isAdmin) {
      items.push({ name: "Panel Capitán", href: "/capitan" });
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

const handleClickOutside = (event) => {
  if (
    isUserMenuOpen.value &&
    userMenuRef.value &&
    !userMenuRef.value.contains(event.target)
  ) {
    isUserMenuOpen.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  isUserMenuOpen.value = false;
  router.push("/");
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <nav class="bg-[#0a1a5c] border-b-2 border-secondary sticky top-0 z-50">
    <div class="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center flex-shrink-0">
          <router-link
            to="/"
            class="flex items-center gap-3 group"
            @click="closeMenu"
          >
            <img
              src="/images/header_logo_futsal.png"
              alt="FutSal La Vall"
              class="w-10 h-10 rounded-lg object-contain group-hover:shadow-lg group-hover:shadow-primary/50 transition-all duration-300"
              @error="$event.target.style.display = 'none'"
            />
            <span
              class="font-bold text-lg text-white hidden sm:block whitespace-nowrap tracking-tight"
            >
              FutSal La Vall
            </span>
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div
          class="hidden lg:flex items-center overflow-x-auto flex-1 px-2 py-2 scrollbar-hide"
        >
          <router-link
            v-for="item in visibleNavigation"
            :key="item.name"
            :to="item.href"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0"
            :class="{
              'bg-secondary text-[#0a1a5c] font-bold shadow-md':
                $route.path === item.href,
              'text-white/80 hover:text-white hover:bg-white/10':
                $route.path !== item.href,
            }"
          >
            {{ item.name }}
          </router-link>
        </div>

        <!-- User Menu / Auth Buttons -->
        <div class="hidden lg:flex items-center gap-3">
          <template v-if="authStore.isAuthenticated">
            <div class="relative" ref="userMenuRef">
              <button
                @click="toggleUserMenu"
                class="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <UserCircleIcon class="w-6 h-6 text-secondary" />
                <span class="hidden xl:inline whitespace-nowrap">{{
                  authStore.userName
                }}</span>
              </button>

              <!-- Dropdown -->
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-56 bg-[#0d1e66] rounded-lg shadow-xl border border-white/10 py-1 transition-all duration-200 ease-out"
              >
                <router-link
                  v-for="item in userMenuItems"
                  :key="item.name"
                  :to="item.href"
                  class="block px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap transition-colors duration-150"
                  @click="isUserMenuOpen = false"
                >
                  {{ item.name }}
                </router-link>
                <hr class="my-1 border-white/10" />
                <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors duration-150"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <router-link
              to="/login"
              class="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 whitespace-nowrap"
            >
              Iniciar Sesión
            </router-link>
            <router-link
              to="/registro"
              class="px-4 py-2 text-sm font-bold text-[#0a1a5c] bg-secondary hover:bg-secondary-400 rounded-lg transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg hover:shadow-secondary/50"
            >
              Registrarse
            </router-link>
          </template>
        </div>

        <!-- Mobile menu button -->
        <div class="lg:hidden flex items-center">
          <button
            @click="toggleMenu"
            class="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Bars3Icon v-if="!isMenuOpen" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <transition name="slide-down">
      <div
        v-if="isMenuOpen"
        class="lg:hidden bg-[#0a1a5c] border-t border-white/10"
      >
        <div class="px-4 py-3 space-y-1 max-h-96 overflow-y-auto">
          <router-link
            v-for="item in visibleNavigation"
            :key="item.name"
            :to="item.href"
            class="block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            :class="{
              'bg-secondary text-[#0a1a5c] font-bold shadow-md':
                $route.path === item.href,
              'text-white/80 hover:text-white hover:bg-white/10':
                $route.path !== item.href,
            }"
            @click="closeMenu"
          >
            {{ item.name }}
          </router-link>
        </div>

        <div class="px-4 py-3 border-t border-white/10">
          <template v-if="authStore.isAuthenticated">
            <div class="flex items-center gap-2 mb-3">
              <UserCircleIcon class="w-6 h-6 text-secondary" />
              <span class="text-sm font-semibold text-white">{{
                authStore.userName
              }}</span>
              <span
                class="badge bg-secondary text-[#0a1a5c] text-xs font-bold"
                >{{ authStore.userRole }}</span
              >
            </div>
            <router-link
              v-for="item in userMenuItems"
              :key="item.name"
              :to="item.href"
              class="block px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
              @click="closeMenu"
            >
              {{ item.name }}
            </router-link>
            <button
              @click="handleLogout"
              class="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg mt-2 transition-colors duration-150"
            >
              Cerrar Sesión
            </button>
          </template>
          <template v-else>
            <router-link
              to="/login"
              class="block px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              @click="closeMenu"
            >
              Iniciar Sesión
            </router-link>
            <router-link
              to="/registro"
              class="block px-4 py-2.5 text-sm font-bold text-[#0a1a5c] bg-secondary hover:bg-secondary-400 rounded-lg mt-2 transition-colors text-center"
              @click="closeMenu"
            >
              Registrarse
            </router-link>
          </template>
        </div>
      </div>
    </transition>
  </nav>
</template>
