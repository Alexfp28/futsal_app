<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BellAlertIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();

const comunicados = ref([]);
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref("");

const form = ref({
  titulo: "",
  contenido: "",
  tipo: "info",
});

const tipoOpciones = [
  { value: "info", label: "Información" },
  { value: "aviso", label: "Aviso" },
  { value: "urgente", label: "Urgente" },
];

const tipoBadge = {
  info: "bg-blue-100 text-blue-700",
  aviso: "bg-yellow-100 text-yellow-700",
  urgente: "bg-red-100 text-red-700",
};

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const loadComunicados = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("comunicados")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    comunicados.value = data || [];
  } catch (e) {
    console.error("Error cargando comunicados:", e);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.value.titulo.trim() || !form.value.contenido.trim()) {
    errorMsg.value = "El título y el contenido son obligatorios.";
    return;
  }
  errorMsg.value = "";
  saving.value = true;
  try {
    const { error } = await supabase.from("comunicados").insert({
      titulo: form.value.titulo.trim(),
      contenido: form.value.contenido.trim(),
      tipo: form.value.tipo,
      visible: true,
      created_by: authStore.user?.id,
    });

    if (error) throw error;

    // Reset formulario
    form.value = { titulo: "", contenido: "", tipo: "info" };
    await loadComunicados();
  } catch (e) {
    console.error("Error creando comunicado:", e);
    errorMsg.value = "Error al publicar el comunicado. Inténtalo de nuevo.";
  } finally {
    saving.value = false;
  }
};

const toggleVisible = async (comunicado) => {
  try {
    const { error } = await supabase
      .from("comunicados")
      .update({ visible: !comunicado.visible })
      .eq("id", comunicado.id);

    if (error) throw error;
    comunicado.visible = !comunicado.visible;
  } catch (e) {
    console.error("Error actualizando visibilidad:", e);
  }
};

const deleteComunicado = async (id) => {
  if (!confirm("¿Eliminar este comunicado definitivamente?")) return;
  try {
    const { error } = await supabase.from("comunicados").delete().eq("id", id);
    if (error) throw error;
    comunicados.value = comunicados.value.filter((c) => c.id !== id);
  } catch (e) {
    console.error("Error eliminando comunicado:", e);
  }
};

onMounted(loadComunicados);
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Gestión de Avisos</h1>
      <p class="page-subtitle">Publica y gestiona los comunicados oficiales de la organización</p>
    </div>

    <!-- Formulario nuevo comunicado -->
    <div class="card p-6 mb-8">
      <h2 class="text-lg font-bold text-notion-text mb-4 flex items-center gap-2">
        <BellAlertIcon class="w-5 h-5 text-primary" />
        Nuevo comunicado
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-notion-text mb-1">Título *</label>
          <input
            v-model="form.titulo"
            type="text"
            placeholder="Ej: Cambio de sede jornada 5"
            class="input w-full"
            :disabled="saving"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-notion-text mb-1">Contenido *</label>
          <textarea
            v-model="form.contenido"
            rows="4"
            placeholder="Escribe el mensaje completo aquí..."
            class="input w-full resize-none"
            :disabled="saving"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-notion-text mb-1">Tipo</label>
          <select v-model="form.tipo" class="input w-full" :disabled="saving">
            <option v-for="op in tipoOpciones" :key="op.value" :value="op.value">
              {{ op.label }}
            </option>
          </select>
        </div>

        <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="saving"
          class="btn-primary flex items-center gap-2"
        >
          <PlusIcon class="w-4 h-4" />
          {{ saving ? "Publicando..." : "Publicar comunicado" }}
        </button>
      </form>
    </div>

    <!-- Lista de comunicados -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="comunicados.length === 0" class="card p-10 text-center text-notion-muted">
      <BellAlertIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>No hay comunicados aún. Crea el primero.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="c in comunicados"
        :key="c.id"
        class="card p-4 flex items-start gap-4"
        :class="{ 'opacity-50': !c.visible }"
      >
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded-full"
              :class="tipoBadge[c.tipo]"
            >
              {{ tipoOpciones.find((o) => o.value === c.tipo)?.label }}
            </span>
            <span v-if="!c.visible" class="text-xs text-notion-muted italic">(oculto)</span>
            <span class="text-xs text-notion-muted">{{ formatFecha(c.created_at) }}</span>
          </div>
          <h3 class="font-semibold text-notion-text truncate">{{ c.titulo }}</h3>
          <p class="text-sm text-notion-muted mt-0.5 line-clamp-2">{{ c.contenido }}</p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            @click="toggleVisible(c)"
            :title="c.visible ? 'Ocultar' : 'Mostrar'"
            class="p-2 rounded-lg text-notion-muted hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <EyeSlashIcon v-if="c.visible" class="w-4 h-4" />
            <EyeIcon v-else class="w-4 h-4" />
          </button>
          <button
            @click="deleteComunicado(c.id)"
            title="Eliminar"
            class="p-2 rounded-lg text-notion-muted hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
