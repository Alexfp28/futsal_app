<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  UserPlusIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const isAuthenticated = authStore.isAuthenticated;

const invitaciones = ref([]);
const loading = ref(true);
const creating = ref(false);
const copied = ref(false);

const form = ref({
  tipo: "jugador",
  equipo_id: "",
});

const equipos = ref([]);

const loadInvitaciones = async () => {
  loading.value = true;
  try {
    // Cargar invitaciones del usuario actual
    if (isAuthenticated) {
      const { data, error } = await supabase
        .from("invitaciones")
        .select("*")
        .eq("creador_id", authStore.user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        invitaciones.value = data || [];
      }
    }

    // Cargar equipos para captains
    if (authStore.isCapitan || authStore.isAdmin) {
      const { data: equiposData } = await supabase
        .from("equipos")
        .select("id, nombre")
        .order("nombre");

      equipos.value = equiposData || [];
    }
  } catch (e) {
    console.error("Error cargando invitaciones:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadInvitaciones();
});

useRouteRefresh(loadInvitaciones);

const generateLink = (codigo) => {
  return `${window.location.origin}/registro?invitacion=${codigo}`;
};

const crearInvitacion = async () => {
  creating.value = true;
  try {
    const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();

    const payload = {
      codigo,
      tipo: form.value.tipo,
      creador_id: authStore.user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
    };

    if (form.value.tipo === "equipo" && form.value.equipo_id) {
      payload.equipo_id = form.value.equipo_id;
    }

    const { error } = await supabase.from("invitaciones").insert(payload);

    if (error) throw error;

    // Recargar
    const { data } = await supabase
      .from("invitaciones")
      .select("*")
      .eq("creador_id", authStore.user.id)
      .order("created_at", { ascending: false });

    invitaciones.value = data || [];
  } catch (e) {
    console.error("Error creando invitación:", e);
  } finally {
    creating.value = false;
  }
};

const copyLink = (codigo) => {
  navigator.clipboard.writeText(generateLink(codigo));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const getTipoLabel = (tipo) => {
  return tipo === "jugador" ? "Jugador" : "Equipo";
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Invitaciones</h1>
      <p class="page-subtitle">
        Invita a nuevos jugadores y equipos a unirse a FutSal La Vall
      </p>
    </div>

    <!-- Solo para usuarios autenticados -->
    <template v-if="isAuthenticated">
      <!-- Crear invitación -->
      <div class="card p-6 mb-8">
        <h2
          class="text-lg font-semibold text-notion-text mb-4 flex items-center gap-2"
        >
          <UserPlusIcon class="w-5 h-5 text-primary" />
          Crear invitación
        </h2>

        <form @submit.prevent="crearInvitacion" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-notion-text mb-1">
              Tipo de invitación
            </label>
            <div class="flex gap-2">
              <button
                type="button"
                @click="form.tipo = 'jugador'"
                :class="[
                  'flex-1 p-3 rounded-lg text-sm font-medium transition-colors',
                  form.tipo === 'jugador'
                    ? 'bg-primary text-white'
                    : 'bg-notion-bg text-notion-muted',
                ]"
              >
                👤 Invitar jugador
              </button>
              <button
                type="button"
                @click="form.tipo = 'equipo'"
                :class="[
                  'flex-1 p-3 rounded-lg text-sm font-medium transition-colors',
                  form.tipo === 'equipo'
                    ? 'bg-primary text-white'
                    : 'bg-notion-bg text-notion-muted',
                ]"
              >
                🏆 Invitar equipo
              </button>
            </div>
          </div>

          <div v-if="form.tipo === 'equipo' && equipos.length > 0">
            <label class="block text-sm font-medium text-notion-text mb-1">
              Equipo
            </label>
            <select v-model="form.equipo_id" class="input w-full">
              <option value="">Selecciona un equipo</option>
              <option v-for="eq in equipos" :key="eq.id" :value="eq.id">
                {{ eq.nombre }}
              </option>
            </select>
          </div>

          <button type="submit" class="btn-primary" :disabled="creating">
            {{ creating ? "Creando..." : "Generar enlace de invitación" }}
          </button>
        </form>
      </div>

      <!-- Mis invitaciones -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-notion-text mb-4">
          Mis invitaciones
        </h2>

        <div v-if="loading" class="flex justify-center py-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          ></div>
        </div>

        <div
          v-else-if="invitaciones.length === 0"
          class="text-center py-8 text-notion-muted"
        >
          <ClipboardDocumentIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No has creado ninguna invitación todavía</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="inv in invitaciones"
            :key="inv.id"
            class="p-4 bg-notion-bg rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-notion-text">
                {{ getTipoLabel(inv.tipo) }}
              </span>
              <span
                v-if="inv.activa"
                class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
              >
                Activa
              </span>
              <span
                v-else
                class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                Inactiva
              </span>
            </div>

            <div class="flex items-center gap-2">
              <input
                :value="generateLink(inv.codigo)"
                readonly
                class="input flex-1 text-sm"
              />
              <button
                @click="copyLink(inv.codigo)"
                class="btn-outline p-2"
                title="Copiar enlace"
              >
                <ClipboardDocumentIcon v-if="!copied" class="w-5 h-5" />
                <CheckCircleIcon v-else class="w-5 h-5 text-green-500" />
              </button>
            </div>

            <p class="text-xs text-notion-muted mt-2">
              Expira:
              {{ new Date(inv.expires_at).toLocaleDateString("es-ES") }} • Usos:
              {{ inv.usos_actuales }}/{{ inv.usos_maximos }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Para usuarios no autenticados -->
    <template v-else>
      <div class="card p-6 text-center">
        <UserPlusIcon class="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-notion-text mb-2">
          ¿Quieres invitar a alguien?
        </h2>
        <p class="text-notion-muted mb-4">
          Inicia sesión para crear enlaces de invitación y compartir con
          jugadores o equipos que quieras añadir a la liga.
        </p>
        <router-link to="/login" class="btn-primary">
          Iniciar sesión
        </router-link>
      </div>
    </template>
  </div>
</template>
