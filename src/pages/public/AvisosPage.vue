<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import {
  BellAlertIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  EnvelopeIcon,
} from "@heroicons/vue/24/outline";

const comunicados = ref([]);
const loading = ref(true);
const error = ref(null);

const tipoConfig = {
  info: {
    label: "Información",
    icon: InformationCircleIcon,
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    icon_color: "text-blue-500",
  },
  aviso: {
    label: "Aviso",
    icon: ExclamationTriangleIcon,
    bg: "bg-secondary/10",
    border: "border-secondary/30",
    badge: "bg-secondary/20 text-yellow-700",
    icon_color: "text-yellow-600",
  },
  urgente: {
    label: "Urgente",
    icon: MegaphoneIcon,
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    icon_color: "text-red-500",
  },
};

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

onMounted(async () => {
  try {
    const { data, error: err } = await supabase
      .from("comunicados")
      .select("id, titulo, contenido, tipo, created_at")
      .eq("visible", true)
      .order("created_at", { ascending: false });

    if (err) throw err;
    comunicados.value = data || [];

    // Marcar como vistos guardando el timestamp actual
    localStorage.setItem("lastSeenAvisos", new Date().toISOString());
  } catch (e) {
    console.error("Error cargando comunicados:", e);
    error.value = "No se pudieron cargar los avisos.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Avisos Oficiales</h1>
      <p class="page-subtitle">
        Comunicados y novedades de la organización FutsalVall
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card p-6 text-center text-red-500">
      <ExclamationTriangleIcon class="w-10 h-10 mx-auto mb-2 opacity-60" />
      <p>{{ error }}</p>
    </div>

    <!-- Sin comunicados -->
    <div v-else-if="comunicados.length === 0" class="card p-12 text-center">
      <BellAlertIcon class="w-14 h-14 mx-auto mb-4 text-notion-muted opacity-40" />
      <p class="text-notion-muted font-medium">No hay avisos publicados aún.</p>
      <p class="text-sm text-notion-muted mt-1 opacity-70">
        Cuando la organización publique comunicados aparecerán aquí.
      </p>
    </div>

    <!-- Lista de comunicados -->
    <div v-else class="space-y-4">
      <div
        v-for="c in comunicados"
        :key="c.id"
        class="card overflow-hidden border"
        :class="[tipoConfig[c.tipo]?.bg, tipoConfig[c.tipo]?.border]"
      >
        <div class="p-5">
          <div class="flex items-start gap-4">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60"
            >
              <component
                :is="tipoConfig[c.tipo]?.icon || InformationCircleIcon"
                class="w-5 h-5"
                :class="tipoConfig[c.tipo]?.icon_color"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span
                  class="text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="tipoConfig[c.tipo]?.badge"
                >
                  {{ tipoConfig[c.tipo]?.label }}
                </span>
                <span class="text-xs text-notion-muted">{{ formatFecha(c.created_at) }}</span>
              </div>
              <h3 class="font-bold text-notion-text text-base mb-2">{{ c.titulo }}</h3>
              <p class="text-sm text-notion-muted whitespace-pre-line leading-relaxed">{{ c.contenido }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contacto oficial -->
    <div class="mt-10 p-5 bg-notion-bg rounded-xl border border-notion-border flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <EnvelopeIcon class="w-6 h-6 text-primary flex-shrink-0" />
      <div class="flex-1">
        <p class="text-sm font-semibold text-notion-text">¿Tienes una incidencia?</p>
        <p class="text-xs text-notion-muted mt-0.5">
          Escríbenos al correo oficial. Es el único canal de atención. No se gestionan consultas por WhatsApp.
        </p>
      </div>
      <a
        href="mailto:futsalvall@gmail.com"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-sm whitespace-nowrap"
      >
        futsalvall@gmail.com
      </a>
    </div>
  </div>
</template>
