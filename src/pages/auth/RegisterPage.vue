<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  nombre: "",
  email: "",
  password: "",
  confirmPassword: "",
  rol: "jugador",
});

const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref(false);

const roles = [
  {
    value: "jugador",
    label: "Jugador",
    description: "Quiero unirme a un equipo existente",
  },
  {
    value: "capitan",
    label: "Capitán",
    description: "Quiero crear y gestionar un equipo",
  },
];

const handleRegister = async () => {
  error.value = "";

  // Validaciones
  if (form.value.password.length < 6) {
    error.value = "La contraseña debe tener al menos 6 caracteres";
    return;
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = "Las contraseñas no coinciden";
    return;
  }

  loading.value = true;

  const result = await authStore.register(
    form.value.email,
    form.value.password,
    form.value.nombre,
    form.value.rol,
  );

  if (result.success) {
    success.value = true;
  } else {
    error.value = result.error;
  }

  loading.value = false;
};

const handleGoogleSignUp = async () => {
  error.value = "";
  loading.value = true;

  const result = await authStore.signInWithGoogle();

  if (!result.success) {
    error.value = result.error;
    loading.value = false;
  }
  // Si es exitoso, Supabase redirige automáticamente
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
          <img
            src="/images/logo_futsal.png"
            alt="FutSal La Vall"
            class="h-36 mx-auto mb-4 object-contain"
          />
          <h1 class="text-2xl font-bold text-notion-text">Crear Cuenta</h1>
          <p class="text-notion-muted mt-2">Únete a FutSal La Vall</p>
        </div>

        <!-- Success Message -->
        <div v-if="success" class="text-center py-8">
          <div
            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-notion-text mb-2">
            ¡Cuenta creada!
          </h2>
          <p class="text-notion-muted mb-6">
            Revisa tu correo electrónico para confirmar tu cuenta.
          </p>
          <router-link to="/login" class="btn-primary">
            Ir a Iniciar Sesión
          </router-link>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-6">
          <!-- Error -->
          <div
            v-if="error"
            class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
          >
            {{ error }}
          </div>

          <!-- Nombre -->
          <div>
            <label
              for="nombre"
              class="block text-sm font-medium text-notion-text mb-2"
            >
              Nombre completo
            </label>
            <input
              id="nombre"
              v-model="form.nombre"
              type="text"
              required
              class="input"
              placeholder="Tu nombre"
            />
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
              v-model="form.email"
              type="email"
              required
              class="input"
              placeholder="tu@email.com"
            />
          </div>

          <!-- Rol -->
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              ¿Qué quieres hacer?
            </label>
            <div class="space-y-2">
              <label
                v-for="rol in roles"
                :key="rol.value"
                class="flex items-start p-3 border rounded-lg cursor-pointer transition-colors"
                :class="
                  form.rol === rol.value
                    ? 'border-primary bg-primary/5'
                    : 'border-notion-border hover:bg-notion-bg'
                "
              >
                <input
                  type="radio"
                  :value="rol.value"
                  v-model="form.rol"
                  class="mt-1 mr-3"
                />
                <div>
                  <span class="font-medium text-notion-text">{{
                    rol.label
                  }}</span>
                  <p class="text-sm text-notion-muted">{{ rol.description }}</p>
                </div>
              </label>
            </div>
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
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input pr-12"
                placeholder="Mínimo 6 caracteres"
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

          <!-- Confirm Password -->
          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-notion-text mb-2"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              class="input"
              placeholder="Repite la contraseña"
            />
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
              Creando cuenta...
            </span>
            <span v-else>Crear Cuenta</span>
          </button>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-notion-border"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-notion-muted"
                >o regístrate con</span
              >
            </div>
          </div>

          <!-- Google Sign Up -->
          <button
            type="button"
            @click="handleGoogleSignUp"
            :disabled="loading"
            class="w-full py-3 px-4 border border-notion-border rounded-lg font-medium text-notion-text hover:bg-notion-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </form>

        <!-- Footer -->
        <div v-if="!success" class="mt-6 text-center">
          <p class="text-sm text-notion-muted">
            ¿Ya tienes cuenta?
            <router-link
              to="/login"
              class="text-primary hover:underline font-medium"
            >
              Inicia sesión
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
