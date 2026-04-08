<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  UserIcon,
  ShieldCheckIcon,
  UsersIcon,
  ArrowsRightLeftIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
defineOptions({ name: "Navbar" });

const MENU_VIEW_STORAGE_KEY = "navbar_menu_view";
const LAST_SEEN_AVISOS_KEY = "lastSeenAvisos";

const isMenuOpen = ref(false);
const isUserMenuOpen = ref(false);
const openDropdown = ref(null);
const avisosNuevos = ref(0);
const userMenuRef = ref(null);
const navRef = ref(null);
const menuView = ref("horizontal");

// Estructura de navegación con grupos desplegables
const navigation = [
  { name: "Identidad", href: "/identidad" },
  {
    name: "Liga",
    dropdown: true,
    items: [
      { name: "Equipos", href: "/equipos" },
      { name: "Rankings", href: "/rankings", hideWhenAuth: true },
      { name: "Palmarés", href: "/palmares" },
      { name: "Traspasos", href: "/traspasos" },
      { name: "Economía", href: "/economia" },
      { name: "Calendario", href: "/calendario", hideWhenAuth: true },
    ],
  },
  {
    name: "Normas",
    dropdown: true,
    items: [
      { name: "Reglamento", href: "/reglamento" },
      { name: "Código de Conducta", href: "/codigo-conducta" },
    ],
  },
  { name: "Sugerencias", href: "/sugerencias" },
  { name: "Avisos", href: "/avisos", highlight: true },
  { name: "Panel interno", href: "/intranet", requiresAuth: true },
];

// Filtra items respetando requiresAuth e hideWhenAuth, incluyendo grupos
const visibleNavigation = computed(() =>
  navigation
    .filter((item) => !item.requiresAuth || authStore.isAuthenticated)
    .map((item) => {
      if (!item.dropdown) return item;
      return {
        ...item,
        items: item.items.filter(
          (sub) => !(sub.hideWhenAuth && authStore.isAuthenticated),
        ),
      };
    })
    .filter((item) => !item.dropdown || item.items.length > 0),
);

// Comprueba si algún hijo de un dropdown está activo (para resaltar el botón padre)
const isDropdownActive = (group) =>
  group.items.some((sub) => route.path === sub.href);

const userMenuItems = computed(() => {
  const items = [];
  if (authStore.isAuthenticated) {
    items.push({ name: "Mi Perfil", href: "/perfil", icon: UserIcon });
    if (authStore.isAdmin) {
      items.push({ name: "Panel Admin", href: "/admin", icon: ShieldCheckIcon });
    }
    if (authStore.isCapitan) {
      items.push({ name: "Panel Capitán", href: "/capitan" });
      items.push({ name: "Mi Equipo", href: "/capitan/equipo", icon: UsersIcon });
    }
    items.push({ name: "Alternar vista", action: "toggle-view", icon: ArrowsRightLeftIcon });
  }
  return items;
});

const userNavigationItems = computed(() =>
  userMenuItems.value.filter((item) => !item.action),
);
const userActionItems = computed(() =>
  userMenuItems.value.filter((item) => item.action),
);

const getUserMenuIcon = (item) => {
  if (item.icon) return item.icon;
  if (item.action === "toggle-view") return ArrowsRightLeftIcon;
  if (item.href === "/perfil") return UserIcon;
  if (item.href === "/admin") return ShieldCheckIcon;
  if (item.href === "/capitan" || item.href === "/capitan/equipo") return UsersIcon;
  return UserCircleIcon;
};

const isVerticalMenuView = computed(
  () => authStore.isAuthenticated && menuView.value === "vertical",
);

const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };
const toggleUserMenu = () => { isUserMenuOpen.value = !isUserMenuOpen.value; };

const toggleDropdown = (name) => {
  openDropdown.value = openDropdown.value === name ? null : name;
};

const handleClickOutside = (event) => {
  // Cerrar menú de usuario
  if (isUserMenuOpen.value && userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    isUserMenuOpen.value = false;
  }
  // Cerrar desplegables de nav
  if (openDropdown.value && navRef.value && !navRef.value.contains(event.target)) {
    openDropdown.value = null;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  isMenuOpen.value = false;
  isUserMenuOpen.value = false;
  router.push("/");
};

const closeMenu = () => {
  isMenuOpen.value = false;
  openDropdown.value = null;
};

const loadMenuViewPreference = () => {
  if (typeof window === "undefined") return;
  const storedView = localStorage.getItem(MENU_VIEW_STORAGE_KEY);
  menuView.value = storedView === "vertical" ? "vertical" : "horizontal";
};

const toggleMenuView = () => {
  menuView.value = menuView.value === "vertical" ? "horizontal" : "vertical";
  isMenuOpen.value = false;
  isUserMenuOpen.value = false;
};

const handleUserMenuItemClick = (item) => {
  if (item.action === "toggle-view") {
    toggleMenuView();
    return;
  }
  isUserMenuOpen.value = false;
};

const loadAvisosCount = async () => {
  try {
    const lastSeen = localStorage.getItem(LAST_SEEN_AVISOS_KEY);
    const query = supabase
      .from("comunicados")
      .select("id", { count: "exact", head: true })
      .eq("visible", true);
    if (lastSeen) query.gt("created_at", lastSeen);
    const { count } = await query;
    avisosNuevos.value = count || 0;
  } catch {
    avisosNuevos.value = 0;
  }
};

onMounted(() => {
  loadMenuViewPreference();
  loadAvisosCount();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

watch(menuView, (value) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(MENU_VIEW_STORAGE_KEY, value);
});

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      isMenuOpen.value = false;
      isUserMenuOpen.value = false;
    }
  },
);

// Cerrar dropdown al navegar
watch(
  () => route.path,
  (path) => {
    openDropdown.value = null;
    if (path === "/avisos") avisosNuevos.value = 0;
  },
);
</script>

<template>
  <nav class="bg-[#0a1a5c] border-b-2 border-secondary sticky top-0 z-50">
    <div class="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center flex-shrink-0">
          <router-link to="/" class="flex items-center gap-3 group" @click="closeMenu">
            <img
              src="/images/header_logo_futsal.png"
              alt="FutSal La Vall"
              class="w-10 h-10 rounded-lg object-contain group-hover:shadow-lg group-hover:shadow-primary/50 transition-all duration-300"
              @error="$event.target.style.display = 'none'"
            />
            <span class="font-bold text-lg text-white hidden sm:block whitespace-nowrap tracking-tight">
              FutSal La Vall
            </span>
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div
          v-if="!isVerticalMenuView"
          ref="navRef"
          class="hidden lg:flex items-center flex-1 px-2 py-2 gap-0.5"
        >
          <template v-for="item in visibleNavigation" :key="item.name">
            <!-- Grupo desplegable -->
            <div v-if="item.dropdown" class="relative flex-shrink-0">
              <button
                @click="toggleDropdown(item.name)"
                class="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap"
                :class="
                  isDropdownActive(item) || openDropdown === item.name
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                "
              >
                {{ item.name }}
                <ChevronDownIcon
                  class="w-3.5 h-3.5 transition-transform duration-200"
                  :class="openDropdown === item.name ? 'rotate-180' : ''"
                />
              </button>

              <!-- Panel desplegable -->
              <transition
                enter-active-class="transition ease-out duration-150"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-100"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-1"
              >
                <div
                  v-if="openDropdown === item.name"
                  class="absolute left-0 top-full mt-1 min-w-48 bg-[#0d1e66] rounded-xl shadow-2xl border border-white/10 py-1.5 z-50"
                >
                  <router-link
                    v-for="sub in item.items"
                    :key="sub.name"
                    :to="sub.href"
                    class="flex items-center px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    :class="{ 'text-white bg-white/10 font-semibold': $route.path === sub.href }"
                    @click="closeMenu"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full bg-secondary mr-2.5 flex-shrink-0"
                      :class="$route.path === sub.href ? 'opacity-100' : 'opacity-40'"
                    ></span>
                    {{ sub.name }}
                  </router-link>
                </div>
              </transition>
            </div>

            <!-- Enlace Avisos (destacado) -->
            <router-link
              v-else-if="item.highlight"
              :to="item.href"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 border"
              :class="
                $route.path === item.href
                  ? 'bg-secondary text-[#0a1a5c] border-secondary shadow-md'
                  : 'text-secondary border-secondary/40 hover:bg-secondary/15 hover:border-secondary/70'
              "
            >
              Avisos
              <span
                v-if="avisosNuevos > 0"
                class="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none"
              >{{ avisosNuevos > 9 ? "9+" : avisosNuevos }}</span>
            </router-link>

            <!-- Enlace normal -->
            <router-link
              v-else
              :to="item.href"
              class="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0"
              :class="{
                'bg-secondary text-[#0a1a5c] font-bold shadow-md': $route.path === item.href,
                'text-white/80 hover:text-white hover:bg-white/10': $route.path !== item.href,
              }"
            >
              {{ item.name }}
            </router-link>
          </template>
        </div>

        <!-- Vista vertical: botón hamburguesa en desktop -->
        <div v-else class="hidden lg:flex items-center flex-1 px-2 py-2">
          <button
            @click="toggleMenu"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Bars3Icon v-if="!isMenuOpen" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
            <span>Menu</span>
          </button>
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
                <span class="hidden xl:inline whitespace-nowrap">{{ authStore.userName }}</span>
              </button>

              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 mt-2 w-56 bg-[#0d1e66] rounded-lg shadow-xl border border-white/10 py-1 transition-all duration-200 ease-out"
              >
                <template v-for="item in userMenuItems" :key="item.name">
                  <button
                    v-if="item.action"
                    type="button"
                    class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap transition-colors duration-150"
                    @click="handleUserMenuItemClick(item)"
                  >
                    <component :is="getUserMenuIcon(item)" class="w-4 h-4 text-secondary flex-shrink-0" />
                    {{ item.name }}
                  </button>
                  <router-link
                    v-else
                    :to="item.href"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap transition-colors duration-150"
                    @click="handleUserMenuItemClick(item)"
                  >
                    <component :is="getUserMenuIcon(item)" class="w-4 h-4 text-secondary flex-shrink-0" />
                    {{ item.name }}
                  </router-link>
                </template>
                <hr class="my-1 border-white/10" />
                <button
                  @click="handleLogout"
                  class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors duration-150"
                >
                  <ArrowRightStartOnRectangleIcon class="w-4 h-4 flex-shrink-0" />
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

    <!-- Mobile / Vertical menu -->
    <transition name="slide-down">
      <div
        v-if="isMenuOpen"
        class="bg-[#0a1a5c] border-t border-white/10"
        :class="{ 'lg:hidden': !isVerticalMenuView }"
      >
        <div class="px-4 py-3 space-y-0.5 max-h-[80vh] overflow-y-auto">
          <template v-for="item in visibleNavigation" :key="item.name">
            <!-- Grupo en móvil: sección con cabecera y subitems -->
            <div v-if="item.dropdown">
              <button
                @click="toggleDropdown(item.name)"
                class="flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors"
                :class="
                  isDropdownActive(item)
                    ? 'text-secondary'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                "
              >
                {{ item.name }}
                <ChevronDownIcon
                  class="w-4 h-4 transition-transform duration-200"
                  :class="openDropdown === item.name ? 'rotate-180' : ''"
                />
              </button>
              <div v-if="openDropdown === item.name" class="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                <router-link
                  v-for="sub in item.items"
                  :key="sub.name"
                  :to="sub.href"
                  class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
                  :class="{
                    'text-white font-semibold bg-white/10': $route.path === sub.href,
                    'text-white/70 hover:text-white hover:bg-white/10': $route.path !== sub.href,
                  }"
                  @click="closeMenu"
                >
                  {{ sub.name }}
                </router-link>
              </div>
            </div>

            <!-- Avisos destacado en móvil -->
            <router-link
              v-else-if="item.highlight"
              :to="item.href"
              class="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors border"
              :class="
                $route.path === item.href
                  ? 'bg-secondary text-[#0a1a5c] border-secondary'
                  : 'text-secondary border-secondary/40 hover:bg-secondary/15'
              "
              @click="closeMenu"
            >
              {{ item.name }}
              <span
                v-if="avisosNuevos > 0"
                class="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none"
              >{{ avisosNuevos > 9 ? "9+" : avisosNuevos }}</span>
            </router-link>

            <!-- Enlace normal -->
            <router-link
              v-else
              :to="item.href"
              class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
              :class="{
                'bg-secondary text-[#0a1a5c] font-bold': $route.path === item.href,
                'text-white/80 hover:text-white hover:bg-white/10': $route.path !== item.href,
              }"
              @click="closeMenu"
            >
              {{ item.name }}
            </router-link>
          </template>
        </div>

        <!-- Auth section en menú móvil -->
        <div class="px-4 py-3 border-t border-white/10">
          <template v-if="authStore.isAuthenticated">
            <div class="flex items-center gap-2 mb-3">
              <UserCircleIcon class="w-6 h-6 text-secondary" />
              <span class="text-sm font-semibold text-white">{{ authStore.userName }}</span>
              <span class="badge bg-secondary text-[#0a1a5c] text-xs font-bold">{{ authStore.userRole }}</span>
            </div>
            <router-link
              v-for="item in userNavigationItems"
              :key="item.name"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
              :to="item.href"
              @click="closeMenu"
            >
              <component :is="getUserMenuIcon(item)" class="w-4 h-4 text-secondary flex-shrink-0" />
              {{ item.name }}
            </router-link>
            <button
              v-for="item in userActionItems"
              :key="item.name"
              type="button"
              class="flex w-full items-center gap-3 text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
              @click="handleUserMenuItemClick(item)"
            >
              <component :is="getUserMenuIcon(item)" class="w-4 h-4 text-secondary flex-shrink-0" />
              {{ item.name }}
            </button>
            <button
              @click="handleLogout"
              class="flex w-full items-center gap-3 text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg mt-2 transition-colors duration-150"
            >
              <ArrowRightStartOnRectangleIcon class="w-4 h-4 flex-shrink-0" />
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
