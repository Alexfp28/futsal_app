<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");

const handleLogin = async () => {
  loading.value = true;
  error.value = "";

  const result = await authStore.login(email.value, password.value);

  if (result.success) {
    const redirect = route.query.redirect || "/intranet";
    router.push(redirect);
  } else {
    error.value = result.error;
  }

  loading.value = false;
};
</script>

<template>
  <div
    class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4"
  >
    <div class="w-full max-w-md">
      <div class="card p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4"
          >
            <span class="text-white font-bold text-2xl">FV</span>
          </div>
          <h1 class="text-2xl font-bold text-notion-text">Iniciar Sesión</h1>
          <p class="text-notion-muted mt-2">
            Accede a tu cuenta de FutSal La Vall
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Error -->
          <div
            v-if="error"
            class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
          >
            {{ error }}
          </div>

          <!-- Email -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-notion-text mb-2"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="input"
              placeholder="tu@email.com"
            />
          </div>

          <!-- Password -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-notion-text mb-2"
            >
              Contraseña
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-notion-muted hover:text-notion-text"
              >
                {{ showPassword ? "Ocultar" : "Ver" }}
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full py-3"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Entrando...
            </span>
            <span v-else>Entrar</span>
          </button>
        </form>

        <!-- Footer -->
        <div class="mt-6 text-center">
          <p class="text-sm text-notion-muted">
            ¿No tienes cuenta?
            <router-link
              to="/registro"
              class="text-primary hover:underline font-medium"
            >
              Regístrate aquí
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
