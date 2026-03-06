<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { STRING } from "@/constants/STRING";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import {
  UserIcon,
  UserPlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const equipo = ref(null);
const jugadores = ref([]);
const jugadoresLibres = ref([]);
const solicitudesPendientes = ref([]);
const loading = ref(true);
const showFicharModal = ref(false);
const showSolicitudesModal = ref(false);
const enviandoPeticion = ref(false);

// Variables para diálogos de confirmación
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref("");
const confirmDialogMessage = ref("");
const confirmDialogType = ref("warning");
const confirmDialogCallback = ref(null);

// Diálogo informativo (sin botones de confirmar/cancelar)
const showInfoDialog = ref(false);
const infoDialogTitle = ref("");
const infoDialogMessage = ref("");
const infoDialogType = ref("info");

// ==================== FUNCIONES DE DIÁLOGO ====================

// Mostrar diálogo de confirmación
const showConfirm = (title, message, type = "warning", callback = null) => {
  confirmDialogTitle.value = title;
  confirmDialogMessage.value = message;
  confirmDialogType.value = type;
  confirmDialogCallback.value = callback;
  showConfirmDialog.value = true;
};

// Manejar confirmación
const handleConfirmAction = () => {
  if (confirmDialogCallback.value) {
    confirmDialogCallback.value();
  }
  showConfirmDialog.value = false;
  confirmDialogCallback.value = null;
};

// Cancelar diálogo de confirmación
const handleConfirmCancel = () => {
  showConfirmDialog.value = false;
  confirmDialogCallback.value = null;
};

// Mostrar diálogo informativo
const showInfo = (title, message, type = "info") => {
  infoDialogTitle.value = title;
  infoDialogMessage.value = message;
  infoDialogType.value = type;
  showInfoDialog.value = true;
};

// ==================== COMPUTED ====================
const jugadoresTitulares = computed(() =>
  jugadores.value.filter((j) => j.es_titular !== false),
);

const jugadoresSuplentes = computed(() =>
  jugadores.value.filter((j) => j.es_titular === false),
);

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    // Cargar equipo del capitán
    const { data: equipoData, error: equipoError } = await supabase
      .from("equipos")
      .select("*")
      .eq("capitan_id", authStore.user.id)
      .single();

    if (equipoError) {
      console.error("Error al cargar equipo:", equipoError);
    }

    equipo.value = equipoData;

    // Cargar jugadores del equipo con su estado en plantilla
    if (equipoData) {
      // Usar la vista plantilla_detallada que hace el JOIN correctamente
      const { data: plantillaDetallada, error: plantillaError } = await supabase
        .from("plantilla_detallada")
        .select("*")
        .eq("equipo_id", equipoData.id);

      if (plantillaError) {
        console.error("Error al cargar plantilla_detallada:", plantillaError);
        // Fallback: método original si la vista no está disponible
        const { data: jugadoresData } = await supabase
          .from("profiles")
          .select("*")
          .eq("equipo_id", equipoData.id);

        if (jugadoresData?.length) {
          const { data: plantillaData } = await supabase
            .from("plantilla")
            .select("*")
            .eq("equipo_id", equipoData.id);

          jugadores.value = jugadoresData.map((j) => {
            const posPlantilla = plantillaData?.find(
              (p) => p.jugador_id === j.id,
            );
            return {
              ...j,
              es_titular: posPlantilla ? posPlantilla.es_titular : true,
              posicion_plantilla: posPlantilla?.posicion_plantilla || 0,
            };
          });
        } else {
          jugadores.value = [];
        }
      } else if (plantillaDetallada?.length) {
        // Mapear datos de la vista directamente
        jugadores.value = plantillaDetallada.map((p) => ({
          id: p.jugador_id,
          nombre: p.nombre_jugador,
          posicion: p.posicion_jugador,
          numero_camiseta: p.numero_camiseta,
          foto_url: p.foto_url,
          es_titular: p.es_titular,
          posicion_plantilla: p.posicion_plantilla,
          equipo_id: p.equipo_id,
        }));
      } else {
        // No hay registros en plantilla, cargar solo perfiles
        const { data: jugadoresData } = await supabase
          .from("profiles")
          .select("*")
          .eq("equipo_id", equipoData.id);

        if (jugadoresData?.length) {
          // Verificar si existen en plantilla
          const { data: plantillaData } = await supabase
            .from("plantilla")
            .select("*")
            .eq("equipo_id", equipoData.id);

          jugadores.value = jugadoresData.map((j) => {
            const posPlantilla = plantillaData?.find(
              (p) => p.jugador_id === j.id,
            );
            return {
              ...j,
              es_titular: posPlantilla ? posPlantilla.es_titular : true,
              posicion_plantilla: posPlantilla?.posicion_plantilla || 0,
            };
          });
        } else {
          jugadores.value = [];
        }
      }

      // Cargar solicitudes de fichaje pendientes (solo las enviadas por jugadores, origen = "jugador")
      // Las solicitudes con origen = "equipo" son invitaciones que el jugador debe aceptar
      const { data: solicitudesData } = await supabase
        .from("solicitudes_fichaje")
        .select("*")
        .eq("equipo_id", equipoData.id)
        .eq("estado", "pendiente")
        .eq("origen", "jugador");

      if (solicitudesData?.length) {
        // Obtener información de los jugadores que solicitaron
        const jugadorIds = solicitudesData.map((s) => s.jugador_id);
        const { data: perfilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", jugadorIds);

        solicitudesPendientes.value = solicitudesData.map((s) => {
          const perfil = perfilesData?.find((p) => p.id === s.jugador_id);
          return {
            ...s,
            nombre: perfil?.nombre || "Jugador",
            posicion: perfil?.posicion || "Sin posición",
            foto_url: perfil?.foto_url,
          };
        });
      } else {
        solicitudesPendientes.value = [];
      }
    }

    // Cargar jugadores libres (que no tienen equipo)
    const { data: libresData } = await supabase
      .from("profiles")
      .select("*")
      .eq("libre", true);

    // Filtrar jugadores que ya tienen cualquier solicitud pendiente a este equipo
    // Se excluyen tanto solicitudes de jugador (origen = "jugador") como invitaciones (origen = "equipo")
    if (libresData && equipo.value) {
      const { data: solicitudesExistentes } = await supabase
        .from("solicitudes_fichaje")
        .select("jugador_id, origen")
        .eq("equipo_id", equipo.value.id)
        .eq("estado", "pendiente");

      const idsConSolicitud = new Set(
        solicitudesExistentes?.map((s) => s.jugador_id) || [],
      );
      jugadoresLibres.value = libresData.filter(
        (j) => !idsConSolicitud.has(j.id),
      );
    } else {
      jugadoresLibres.value = libresData || [];
    }
  } catch (e) {
    console.error("Error al cargar datos:", e);
    // Datos de ejemplo
    equipo.value = {
      id: "equipo-1",
      nombre: "Los Tigres",
      color_principal: "#164bf0",
      color_secundario: "#f6ec15",
    };
    jugadores.value = [
      {
        id: "jugador-1",
        nombre: "Carlos García",
        posicion: "Ala",
        numero_camiseta: 7,
        rol: "capitan",
        es_titular: true,
      },
      {
        id: "jugador-2",
        nombre: "Pedro Ruiz",
        posicion: "Portero",
        numero_camiseta: 1,
        rol: "jugador",
        es_titular: true,
      },
      {
        id: "jugador-3",
        nombre: "Miguel Torres",
        posicion: "Cierre",
        numero_camiseta: 4,
        rol: "jugador",
        es_titular: true,
      },
      {
        id: "jugador-4",
        nombre: "Luis Fernández",
        posicion: "Ala",
        numero_camiseta: 10,
        rol: "jugador",
        es_titular: true,
      },
      {
        id: "jugador-7",
        nombre: "Antonio Martínez",
        posicion: "Defensa",
        numero_camiseta: 3,
        rol: "jugador",
        es_titular: false,
      },
      {
        id: "jugador-8",
        nombre: "David Sánchez",
        posicion: "Ala",
        numero_camiseta: 11,
        rol: "jugador",
        es_titular: false,
      },
    ];
    jugadoresLibres.value = [
      { id: "jugador-5", nombre: "Alejandro Sánchez", posicion: "Portero" },
      { id: "jugador-6", nombre: "Bruno López", posicion: "Ala" },
    ];
    solicitudesPendientes.value = [
      {
        id: "sol-1",
        jugador_id: "jugador-9",
        equipo_id: "equipo-1",
        origen: "jugador",
        nombre: "Javier Torres",
        posicion: "Ala",
        created_at: new Date().toISOString(),
      },
    ];
  } finally {
    loading.value = false;
  }
};

// Enviar petición de fichaje al jugador
const enviarPeticionFichaje = async (jugador) => {
  if (!equipo.value) return;

  enviandoPeticion.value = true;
  try {
    await supabase.from("solicitudes_fichaje").insert({
      jugador_id: jugador.id,
      equipo_id: equipo.value.id,
      origen: "equipo",
      estado: "pendiente",
    });

    // Recargar datos
    await loadData();
    showFicharModal.value = false;
    showInfo(
      "Invitación enviada",
      `Se ha enviado una invitación a ${jugador.nombre}. El jugador deberá aceptar tu solicitud para unirse al equipo.`,
      "success",
    );
  } catch (e) {
    console.error(STRING.ERRORS.ENVIAR_PETICION, e);
    // Simular envío - mostrar diálogo informativo
    showInfo(
      STRING.DIALOGS.PETICION_ENVIADA,
      STRING.EQUIPO.PETICION_ENVIADA(jugador.nombre),
      "info",
    );
    await loadData();
    showFicharModal.value = false;
  } finally {
    enviandoPeticion.value = false;
  }
};

// Aceptar solicitud de un jugador que quiere unirse
const aceptarSolicitud = async (solicitud) => {
  try {
    // Actualizar estado de la solicitud
    await supabase
      .from("solicitudes_fichaje")
      .update({ estado: "aceptada" })
      .eq("id", solicitud.id);

    // Asignar jugador al equipo
    await supabase
      .from("profiles")
      .update({ equipo_id: equipo.value.id, libre: false })
      .eq("id", solicitud.jugador_id);

    // Agregar a plantilla como suplente por defecto
    await supabase.from("plantilla").insert({
      equipo_id: equipo.value.id,
      jugador_id: solicitud.jugador_id,
      es_titular: false,
      posicion_plantilla: 99,
    });

    // Recargar datos
    await loadData();
    showSolicitudesModal.value = false;
  } catch (e) {
    console.error("Error al aceptar solicitud:", e);
    // Simular aceptación
    const nuevoJugador = {
      id: solicitud.jugador_id,
      nombre: solicitud.nombre,
      posicion: solicitud.posicion,
      numero_camiseta: null,
      rol: "jugador",
      es_titular: false,
    };
    jugadores.value.push(nuevoJugador);
    solicitudesPendientes.value = solicitudesPendientes.value.filter(
      (s) => s.id !== solicitud.id,
    );
    showSolicitudesModal.value = false;
  }
};

// Rechazar solicitud
const rechazarSolicitud = async (solicitud) => {
  // Usar diálogo de confirmación en lugar de confirm()
  showConfirm(
    STRING.DIALOGS.CONFIRM_RECHAZO,
    STRING.EQUIPO.RECHAZAR_SOLICITUD(solicitud.nombre),
    "warning",
    async () => {
      try {
        await supabase
          .from("solicitudes_fichaje")
          .update({ estado: "rechazada" })
          .eq("id", solicitud.id);

        await loadData();
      } catch (e) {
        console.error(STRING.ERRORS.RECHAZAR_SOLICITUD, e);
        // Simular rechazo
        solicitudesPendientes.value = solicitudesPendientes.value.filter(
          (s) => s.id !== solicitud.id,
        );
      }
    },
  );
};

// Enviar invitación a un jugador
const enviarInvitacion = async (jugador) => {
  if (!equipo.value) return;

  try {
    await supabase.from("solicitudes_fichaje").insert({
      jugador_id: jugador.id,
      equipo_id: equipo.value.id,
      origen: "equipo",
      estado: "pendiente",
    });

    await loadData();
    showInfo(
      "Invitación enviada",
      `Se ha enviado una invitación a ${jugador.nombre}. El jugador deberá aceptar tu solicitud para unirse al equipo.`,
      "success",
    );
  } catch (e) {
    console.error("Error al enviar invitación:", e);
    showInfo(
      "Invitación enviada (simulado)",
      `Se ha enviado una invitación a ${jugador.nombre}. El jugador deberá aceptar tu solicitud para unirse al equipo.`,
      "success",
    );
  }
};

// Cambiar estado de titular/suplente
const cambiarEstadoPlantilla = async (jugador, esTitular) => {
  if (jugador.rol === "capitan") return;

  try {
    if (equipo.value) {
      // Verificar si ya existe en plantilla
      const { data: existente } = await supabase
        .from("plantilla")
        .select("*")
        .eq("equipo_id", equipo.value.id)
        .eq("jugador_id", jugador.id)
        .single();

      if (existente) {
        await supabase
          .from("plantilla")
          .update({ es_titular: esTitular })
          .eq("id", existente.id);
      } else {
        await supabase.from("plantilla").insert({
          equipo_id: equipo.value.id,
          jugador_id: jugador.id,
          es_titular: esTitular,
          posicion_plantilla: esTitular ? 1 : 99,
        });
      }
    }

    // Actualizar estado local
    jugador.es_titular = esTitular;
  } catch (e) {
    console.error("Error al cambiar estado:", e);
    // Simular cambio
    jugador.es_titular = esTitular;
  }
};

const expulsarJugador = async (jugador) => {
  if (jugador.rol === "capitan") {
    // Mostrar diálogo informativo de error
    showInfo(
      STRING.DIALOGS.CAPITAN_NO_EXPULSABLE,
      STRING.EQUIPO.NO_EXPULSAR_CAPITAN,
      "danger",
    );
    return;
  }

  // Usar diálogo de confirmación en lugar de confirm()
  showConfirm(
    STRING.DIALOGS.CONFIRM_EXPULSION,
    STRING.EQUIPO.EXPULSION_JUGADOR(jugador.nombre),
    "danger",
    async () => {
      try {
        await supabase
          .from("profiles")
          .update({ equipo_id: null, libre: true })
          .eq("id", jugador.id);

        // Eliminar de plantilla
        if (equipo.value) {
          await supabase
            .from("plantilla")
            .delete()
            .eq("equipo_id", equipo.value.id)
            .eq("jugador_id", jugador.id);
        }

        await loadData();
      } catch (e) {
        console.error(STRING.ERRORS.EXPULSAR_JUGADOR, e);
        // Simular expulsión
        jugadores.value = jugadores.value.filter((j) => j.id !== jugador.id);
        jugadoresLibres.value.push({
          ...jugador,
          equipo_id: null,
          libre: true,
        });
      }
    },
  );
};
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="page-title">Mi Equipo</h1>
        <p class="page-subtitle">Gestiona los jugadores de tu equipo</p>
      </div>
      <div class="flex items-center space-x-3">
        <!-- Botón de solicitudes pendientes -->
        <button
          v-if="solicitudesPendientes.length > 0"
          @click="showSolicitudesModal = true"
          class="btn-secondary flex items-center space-x-2 relative"
        >
          <ClockIcon class="w-5 h-5" />
          <span>Solicitudes</span>
          <span
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {{ solicitudesPendientes.length }}
          </span>
        </button>
        <button
          @click="showFicharModal = true"
          class="btn-primary flex items-center space-x-2"
        >
          <UserPlusIcon class="w-5 h-5" />
          <span>Fichar Jugador</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <!-- Info del equipo -->
      <div class="card p-6 mb-8">
        <div class="flex items-center space-x-4">
          <div
            class="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl"
            :style="{ backgroundColor: equipo?.color_principal || '#164bf0' }"
          >
            {{ equipo?.nombre?.charAt(0) || "?" }}
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-notion-text">
              {{ equipo?.nombre }}
            </h2>
            <div class="flex items-center space-x-4 mt-2">
              <div class="flex items-center space-x-2">
                <span class="text-sm text-notion-muted">Colores:</span>
                <div
                  class="w-5 h-5 rounded-full border border-notion-border"
                  :style="{ backgroundColor: equipo?.color_principal }"
                ></div>
                <div
                  class="w-5 h-5 rounded-full border border-notion-border"
                  :style="{ backgroundColor: equipo?.color_secundario }"
                ></div>
              </div>
              <span class="text-sm text-notion-muted">
                {{ jugadores.length }} jugadores
              </span>
              <span class="text-sm text-notion-muted">
                ({{ jugadoresTitulares.length }} titulares /
                {{ jugadoresSuplentes.length }} suplentes)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Plantilla: Titulares -->
      <div class="card overflow-hidden mb-6">
        <div class="p-4 border-b border-notion-border bg-primary/5">
          <h3
            class="font-semibold text-notion-text flex items-center space-x-2"
          >
            <UsersIcon class="w-5 h-5 text-primary" />
            <span>Jugadores Titulares</span>
            <span class="text-sm text-notion-muted"
              >({{ jugadoresTitulares.length }})</span
            >
          </h3>
        </div>
        <div class="divide-y divide-notion-border">
          <div
            v-for="jugador in jugadoresTitulares"
            :key="jugador.id"
            class="flex items-center justify-between p-4 hover:bg-notion-bg transition-colors"
          >
            <div class="flex items-center space-x-4">
              <div
                class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <span class="text-primary font-bold">{{
                  jugador.numero_camiseta || "?"
                }}</span>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-notion-text">{{
                    jugador.nombre
                  }}</span>
                  <span
                    v-if="jugador.rol === 'capitan'"
                    class="badge badge-secondary text-xs"
                    >Capitán</span
                  >
                </div>
                <span class="text-sm text-notion-muted">{{
                  jugador.posicion || "Sin posición"
                }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <!-- Botón para mover a suplente -->
              <button
                v-if="jugador.rol !== 'capitan'"
                @click="cambiarEstadoPlantilla(jugador, false)"
                class="p-2 text-notion-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Mover a suplente"
              >
                <ArrowPathIcon class="w-5 h-5" />
              </button>
              <!-- Botón expulsar -->
              <button
                v-if="jugador.rol !== 'capitan'"
                @click="expulsarJugador(jugador)"
                class="p-2 text-notion-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div
            v-if="jugadoresTitulares.length === 0"
            class="text-center py-8 text-notion-muted"
          >
            No hay jugadores titulares
          </div>
        </div>
      </div>

      <!-- Plantilla: Suplentes -->
      <div class="card overflow-hidden">
        <div class="p-4 border-b border-notion-border bg-gray-50">
          <h3
            class="font-semibold text-notion-text flex items-center space-x-2"
          >
            <UsersIcon class="w-5 h-5 text-gray-400" />
            <span>Jugadores Suplentes</span>
            <span class="text-sm text-notion-muted"
              >({{ jugadoresSuplentes.length }})</span
            >
          </h3>
        </div>
        <div class="divide-y divide-notion-border">
          <div
            v-for="jugador in jugadoresSuplentes"
            :key="jugador.id"
            class="flex items-center justify-between p-4 hover:bg-notion-bg transition-colors"
          >
            <div class="flex items-center space-x-4">
              <div
                class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center"
              >
                <span class="text-gray-500 font-bold">{{
                  jugador.numero_camiseta || "?"
                }}</span>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-notion-text">{{
                    jugador.nombre
                  }}</span>
                </div>
                <span class="text-sm text-notion-muted">{{
                  jugador.posicion || "Sin posición"
                }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <!-- Botón para mover a titular -->
              <button
                @click="cambiarEstadoPlantilla(jugador, true)"
                class="p-2 text-notion-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Mover a titular"
              >
                <ArrowPathIcon class="w-5 h-5 rotate-180" />
              </button>
              <!-- Botón expulsar -->
              <button
                @click="expulsarJugador(jugador)"
                class="p-2 text-notion-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div
            v-if="jugadoresSuplentes.length === 0"
            class="text-center py-8 text-notion-muted"
          >
            No hay jugadores suplentes
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Solicitudes Pendientes -->
    <div
      v-if="showSolicitudesModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-notion-text">
            Solicitudes de Jugadores
          </h2>
          <button
            @click="showSolicitudesModal = false"
            class="p-2 hover:bg-notion-bg rounded-lg"
          >
            <XMarkIcon class="w-5 h-5 text-notion-muted" />
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="solicitud in solicitudesPendientes"
            :key="solicitud.id"
            class="flex items-center justify-between p-3 bg-notion-bg rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <UserIcon class="w-5 h-5 text-primary" />
              </div>
              <div>
                <p class="font-medium text-notion-text text-sm">
                  {{ solicitud.nombre }}
                </p>
                <p class="text-xs text-notion-muted">
                  {{ solicitud.posicion }}
                </p>
                <p class="text-xs text-notion-muted">
                  {{ new Date(solicitud.created_at).toLocaleDateString() }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="aceptarSolicitud(solicitud)"
                class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Aceptar"
              >
                <CheckIcon class="w-5 h-5" />
              </button>
              <button
                @click="rechazarSolicitud(solicitud)"
                class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Rechazar"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div
            v-if="solicitudesPendientes.length === 0"
            class="text-center py-8 text-notion-muted"
          >
            No hay solicitudes pendientes
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Fichar -->
    <div
      v-if="showFicharModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-notion-text">
            Enviar Petición de Fichaje
          </h2>
          <button
            @click="showFicharModal = false"
            class="p-2 hover:bg-notion-bg rounded-lg"
          >
            <XMarkIcon class="w-5 h-5 text-notion-muted" />
          </button>
        </div>

        <p class="text-sm text-notion-muted mb-4">
          Selecciona un jugador libre para enviarle una petición. El jugador
          deberá aceptar tu invitación para unirse al equipo.
        </p>

        <div class="space-y-3">
          <div
            v-for="jugador in jugadoresLibres"
            :key="jugador.id"
            class="flex items-center justify-between p-3 bg-notion-bg rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <UserIcon class="w-5 h-5 text-primary" />
              </div>
              <div>
                <p class="font-medium text-notion-text text-sm">
                  {{ jugador.nombre }}
                </p>
                <p class="text-xs text-notion-muted">
                  {{ jugador.posicion || "Sin posición" }}
                </p>
              </div>
            </div>
            <button
              @click="enviarPeticionFichaje(jugador)"
              :disabled="enviandoPeticion"
              class="btn-primary text-xs py-1 px-3 disabled:opacity-50"
            >
              {{ enviandoPeticion ? "Enviando..." : "Enviar Invitación" }}
            </button>
          </div>
          <div
            v-if="jugadoresLibres.length === 0"
            class="text-center py-8 text-notion-muted"
          >
            No hay jugadores libres disponibles
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== DIÁLOGOS DE CONFIRMACIÓN ==================== -->

    <!-- Diálogo de confirmación (para acciones peligrosas) -->
    <ConfirmDialog
      :show="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      :type="confirmDialogType"
      :confirm-text="STRING.BUTTONS.CONFIRM"
      :cancel-text="STRING.BUTTONS.CANCEL"
      @confirm="handleConfirmAction"
      @cancel="handleConfirmCancel"
      @close="handleConfirmCancel"
    />

    <!-- Diálogo informativo (para mensajes de información) -->
    <ConfirmDialog
      :show="showInfoDialog"
      :title="infoDialogTitle"
      :message="infoDialogMessage"
      :type="infoDialogType"
      :show-cancel-button="false"
      :confirm-text="STRING.BUTTONS.ACCEPT"
      @confirm="showInfoDialog = false"
      @close="showInfoDialog = false"
    />
  </div>
</template>
