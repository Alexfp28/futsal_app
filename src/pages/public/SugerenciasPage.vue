<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  LightBulbIcon,
  BugAntIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const isAuthenticated = authStore.isAuthenticated;

const sugerencias = ref([]);
const loading = ref(true);
const sending = ref(false);
const success = ref(false);

const form = ref({
  titulo: "",
  descripcion: "",
  categoria: "sugencia",
});

const categorias = [
  { id: "mejora", label: "Mejora", icon: LightBulbIcon },
  { id: "bug", label: "Error/Bug", icon: BugAntIcon },
  { id: "sugencia", label: "Sugerencia", icon: ChatBubbleLeftIcon },
  { id: "otro", label: "Otro", icon: ChatBubbleLeftIcon },
];

const estados = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  revisado: { label: "Revisado", color: "bg-blue-100 text-blue-800" },
  implementado: { label: "Implementado", color: "bg-green-100 text-green-800" },
  rechazado: { label: "Rechazado", color: "bg-gray-100 text-gray-800" },
};

const loadSugerencias = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("sugerencias")
      .select("*, usuario:profiles(nombre)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    sugerencias.value = data || [];
  } catch (e) {
    console.error("Error cargando sugerencias:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSugerencias();
});

// Recargar datos cuando se navega a esta ruta
useRouteRefresh(loadSugerencias);

const handleSubmit = async () => {
  if (!form.value.titulo || !form.value.descripcion) return;

  sending.value = true;
  try {
    const payload = {
      titulo: form.value.titulo,
      descripcion: form.value.descripcion,
      categoria: form.value.categoria,
      usuario_id: authStore.user?.id || null,
    };

    const { error } = await supabase.from("sugerencias").insert(payload);

    if (error) throw error;

    success.value = true;
    form.value = { titulo: "", descripcion: "", categoria: "sugencia" };

    setTimeout(() => {
      success.value = false;
    }, 3000);
  } catch (e) {
    console.error("Error enviando sugerencia:", e);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Sugerencias y Feedback</h1>
      <p class="page-subtitle">
        Ayúdanos a mejorar FutSal La Vall con tus ideas y comentarios
      </p>
    </div>

    <!-- Formulario para usuarios autenticados -->
    <div v-if="isAuthenticated" class="card p-6 mb-8">
      <h2
        class="text-lg font-semibold text-notion-text mb-4 flex items-center gap-2"
      >
        <PaperAirplaneIcon class="w-5 h-5 text-primary" />
        Enviar sugerencia
      </h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-notion-text mb-1">
            Título
          </label>
          <input
            v-model="form.titulo"
            type="text"
            class="input w-full"
            placeholder="Breve resumen de tu sugerencia"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-notion-text mb-1">
            Categoría
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categorias"
              :key="cat.id"
              type="button"
              @click="form.categoria = cat.id"
              :class="[
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                form.categoria === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-notion-bg text-notion-muted hover:bg-primary/10',
              ]"
            >
              <component :is="cat.icon" class="w-4 h-4" />
              {{ cat.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-notion-text mb-1">
            Descripción
          </label>
          <textarea
            v-model="form.descripcion"
            class="input w-full"
            rows="4"
            placeholder="Explica tu sugerencia con detalle..."
            required
          ></textarea>
        </div>

        <div class="flex items-center gap-4">
          <button type="submit" class="btn-primary" :disabled="sending">
            {{ sending ? "Enviando..." : "Enviar sugerencia" }}
          </button>

          <span v-if="success" class="text-green-600 text-sm">
            ✓ Sugerencia enviada correctamente
          </span>
        </div>
      </form>
    </div>

    <!-- Mensaje para usuarios no autenticados -->
    <div v-else class="card p-6 mb-8 bg-primary/5 border border-primary/20">
      <h2 class="text-lg font-semibold text-notion-text mb-2">
        ¿Tienes una idea?
      </h2>
      <p class="text-notion-muted mb-4">
        Inicia sesión para enviar tus sugerencias y ayudar a mejorar la
        plataforma.
      </p>
      <router-link to="/login" class="btn-primary">
        Iniciar sesión
      </router-link>
    </div>

    <!-- Lista de sugerencias -->
    <div class="card p-6">
      <h2 class="text-lg font-semibold text-notion-text mb-4">
        Sugerencias recientes
      </h2>

      <div v-if="loading" class="flex justify-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        ></div>
      </div>

      <div
        v-else-if="sugerencias.length === 0"
        class="text-center py-8 text-notion-muted"
      >
        <ChatBubbleLeftIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No hay sugerencias todavía. ¡Sé el primero en enviar una!</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="sug in sugerencias"
          :key="sug.id"
          class="p-4 bg-notion-bg rounded-lg"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  sug.categoria === 'mejora'
                    ? 'bg-purple-100 text-purple-700'
                    : sug.categoria === 'bug'
                      ? 'bg-red-100 text-red-700'
                      : sug.categoria === 'sugencia'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700',
                ]"
              >
                {{ sug.categoria }}
              </span>
              <span
                v-if="sug.estado"
                :class="[
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  estados[sug.estado]?.color || 'bg-gray-100 text-gray-700',
                ]"
              >
                {{ estados[sug.estado]?.label || sug.estado }}
              </span>
            </div>
            <span class="text-xs text-notion-muted">
              {{ new Date(sug.created_at).toLocaleDateString("es-ES") }}
            </span>
          </div>

          <h3 class="font-semibold text-notion-text mb-1">{{ sug.titulo }}</h3>
          <p class="text-sm text-notion-muted">{{ sug.descripcion }}</p>

          <p v-if="sug.usuario?.nombre" class="text-xs text-notion-muted mt-2">
            Por: {{ sug.usuario.nombre }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
