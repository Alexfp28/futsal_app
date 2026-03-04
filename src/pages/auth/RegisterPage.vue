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
