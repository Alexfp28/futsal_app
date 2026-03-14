<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { STRING } from "@/constants/STRING";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import {
  UserIcon,
  UserPlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
  PencilSquareIcon,
  CameraIcon,
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

// ==================== DRAWER EDICIÓN DEL EQUIPO ====================
const showEditPanel = ref(false);
const savingEquipo = ref(false);
const editForm = ref({
  nombre: "",
  color_principal: "#164bf0",
  color_secundario: "#f6ec15",
  escudo_url: "",
});

const escudoPreview = ref(null);
const escudoFile = ref(null);
const uploadingEscudo = ref(false);

const openEditPanel = () => {
  if (equipo.value) {
    editForm.value = {
      nombre: equipo.value.nombre || "",
      color_principal: equipo.value.color_principal || "#164bf0",
      color_secundario: equipo.value.color_secundario || "#f6ec15",
      escudo_url: equipo.value.escudo_url || "",
    };
    escudoPreview.value = equipo.value.escudo_url || null;
    escudoFile.value = null;
  }
  showEditPanel.value = true;
};

const closeEditPanel = () => {
  showEditPanel.value = false;
  escudoFile.value = null;
  escudoPreview.value = null;
};

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

// Recargar datos cuando se navega a esta ruta
useRouteRefresh(loadData);

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

    // Rellenar formulario de edición
    if (equipoData) {
      editForm.value = {
        nombre: equipoData.nombre || "",
        color_principal: equipoData.color_principal || "#164bf0",
        color_secundario: equipoData.color_secundario || "#f6ec15",
        escudo_url: equipoData.escudo_url || "",
      };
      escudoPreview.value = equipoData.escudo_url || null;
    }

    // Cargar jugadores del equipo con su estado en plantilla
    if (equipoData) {
      // Cargamos primero todos los perfiles asignados al equipo (fuente de verdad)
      const { data: jugadoresData, error: jugadoresError } = await supabase
        .from("profiles")
        .select("*")
        .eq("equipo_id", equipoData.id);

      if (jugadoresError) {
        console.error("Error al cargar jugadores:", jugadoresError);
        jugadores.value = [];
      } else if (jugadoresData?.length) {
        // Cargamos la información de la plantilla para estos jugadores
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
      escudo_url: null,
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
  if (!authStore.isCapitan || !equipo.value) return;

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
  if (!authStore.isCapitan) return;
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

    // Agregar a plantilla como titular por defecto
    await supabase.from("plantilla").insert({
      equipo_id: equipo.value.id,
      jugador_id: solicitud.jugador_id,
      es_titular: true,
      posicion_plantilla: 0,
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
  if (!authStore.isCapitan) return;
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
  if (!authStore.isCapitan || jugador.rol === "capitan") return;

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

const expulsarJugador = (jugador) => {
  if (jugador.rol === "capitan") {
    // Mostrar diálogo informativo de error
    showInfo(
      STRING.DIALOGS.CAPITAN_NO_EXPULSABLE,
      STRING.EQUIPO.NO_EXPULSAR_CAPITAN,
      "danger",
    );
    return;
  }

  // Usar diálogo de confirmación
  showConfirm(
    STRING.DIALOGS.CONFIRM_EXPULSION,
    STRING.EQUIPO.EXPULSION_JUGADOR(jugador.nombre),
    "danger",
    async () => {
      try {
        const { error: expulsarError } = await supabase
          .from("profiles")
          .update({ equipo_id: null, libre: true })
          .eq("id", jugador.id);
        if (expulsarError) throw expulsarError;

        // Eliminar de plantilla
        if (equipo.value) {
          const { error: plantillaError } = await supabase
            .from("plantilla")
            .delete()
            .eq("equipo_id", equipo.value.id)
            .eq("jugador_id", jugador.id);
          if (plantillaError) throw plantillaError;
        }

        await loadData();
      } catch (e) {
        console.error(STRING.ERRORS.EXPULSAR_JUGADOR, e);
        showInfo(
          STRING.DIALOGS.ERROR,
          e?.message || STRING.ERRORS.EXPULSAR_JUGADOR,
          "danger",
        );
      }
    },
  );
};
// Guardar datos del equipo (sólo nombre y colores)
const saveEquipo = async () => {
  if (!equipo.value) return;
  savingEquipo.value = true;
  try {
    let finalEscudoUrl = editForm.value.escudo_url;

    // Subir nueva foto si hay
    if (escudoFile.value) {
      const uploadedUrl = await uploadEscudo(equipo.value.id);
      if (uploadedUrl) {
        finalEscudoUrl = uploadedUrl;
      }
    }

    const updates = {
      nombre: editForm.value.nombre,
      color_principal: editForm.value.color_principal,
      color_secundario: editForm.value.color_secundario,
      escudo_url: finalEscudoUrl || null,
    };

    const { error } = await supabase
      .from("equipos")
      .update(updates)
      .eq("id", equipo.value.id);

    if (error) throw error;

    // Actualizar el equipo local para reflejar cambios inmediatamente
    equipo.value = {
      ...equipo.value,
      ...updates,
    };

    showInfo(
      "Equipo actualizado",
      "Los datos del equipo se han guardado correctamente.",
      "success",
    );
    closeEditPanel();
  } catch (e) {
    console.error("Error al guardar equipo:", e);
    showInfo(
      "Error al guardar",
      e?.message || "No se pudo guardar la información del equipo.",
      "danger",
    );
  } finally {
    savingEquipo.value = false;
  }
};

// ==================== LÓGICA DE ESCUDO ====================
// Manejar selección de archivo de imagen
const handleEscudoChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith("image/")) {
      showInfo("Error", "Por favor selecciona un archivo de imagen válido", "danger");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showInfo("Error", "La imagen no puede superar los 2MB", "danger");
      return;
    }

    escudoFile.value = file;
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      escudoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Subir imagen a Supabase Storage
const uploadEscudo = async (equipoId) => {
  if (!escudoFile.value) return null;

  uploadingEscudo.value = true;
  try {
    const bucketName = "escudos-equipo";

    // Intentar crear el bucket si no existe
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === bucketName);

      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
        });
      }
    } catch (bucketError) {
      console.warn("No se pudo verificar/crear bucket de escudos", bucketError);
    }

    const fileExt = escudoFile.value.name.split(".").pop();
    const fileName = `equipo-${equipoId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, escudoFile.value, {
        upsert: true,
        contentType: escudoFile.value.type,
      });

    if (error) {
      console.error("Error en upload:", error);
      throw error;
    }

    const { data: urlData, error: urlError } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (urlError) {
      throw urlError;
    }

    return urlData.publicUrl;
  } catch (e) {
    console.error("Error subiendo escudo:", e);
    showInfo("Error", "Error al subir el escudo. Por favor, inténtalo de nuevo.", "danger");
    return null;
  } finally {
    uploadingEscudo.value = false;
  }
};

// Eliminar escudo de equipo
const eliminarEscudo = async () => {
  if (
    equipo.value?.escudo_url &&
    equipo.value.escudo_url.includes("escudos-equipo")
  ) {
    try {
      const fileName = equipo.value.escudo_url.split("/").pop();
      await supabase.storage.from("escudos-equipo").remove([fileName]);
    } catch (e) {
      console.warn("No se pudo eliminar el escudo anterior:", e);
    }
  }
  escudoFile.value = null;
  escudoPreview.value = null;
  editForm.value.escudo_url = "";
};
</script>

<template>
  <div class="page-container">
    <!-- Encabezado -->
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="page-title">Mi Equipo</h1>
        <p class="page-subtitle">Gestiona los jugadores de tu equipo</p>
      </div>
      <div v-if="authStore.isCapitan" class="flex items-center space-x-3">
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
        <!-- Botón editar equipo -->
        <button
          v-if="equipo"
          @click="openEditPanel"
          class="btn-secondary flex items-center space-x-2"
        >
          <PencilSquareIcon class="w-5 h-5" />
          <span>Editar Equipo</span>
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

    <template v-if="!loading">
      <!-- Info del equipo -->
      <div class="card p-6 mb-8">
        <div class="flex items-center space-x-4">
          <div
            v-if="equipo?.escudo_url"
            class="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0"
          >
            <img :src="equipo.escudo_url" alt="Escudo del equipo" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl flex-shrink-0"
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
            <div v-if="authStore.isCapitan" class="flex items-center space-x-2">
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
            <div v-if="authStore.isCapitan" class="flex items-center space-x-2">
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
            <div v-if="authStore.isCapitan" class="flex items-center space-x-2">
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
              v-if="authStore.isCapitan"
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

    <!-- ==================== DRAWER: EDITAR EQUIPO ==================== -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="showEditPanel"
          class="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          @click="closeEditPanel"
        />
      </Transition>

      <Transition name="slideover">
        <div
          v-if="showEditPanel"
          class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
          @click.stop
        >
          <!-- Header del panel -->
          <div class="flex items-center justify-between border-b border-notion-border px-6 py-4">
            <div>
              <h2 class="text-base font-semibold text-notion-text">Editar equipo</h2>
              <p class="text-xs text-notion-muted mt-0.5">
                Los cambios se guardarán en la base de datos al instante.
              </p>
            </div>
            <button
              type="button"
              class="rounded-full p-1.5 text-notion-muted hover:bg-notion-bg hover:text-notion-text transition-colors"
              @click="closeEditPanel"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Cuerpo -->
          <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <!-- Preview en vivo del escudo -->
            <div class="rounded-xl border border-notion-border bg-notion-bg px-4 py-4">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-notion-muted mb-3 text-center">
                Logotipo del equipo
              </p>
              
              <div class="flex flex-col items-center justify-center gap-3">
                <div class="relative group">
                  <div
                    v-if="escudoPreview"
                    class="w-24 h-24 rounded-xl overflow-hidden border-4 border-white shadow-lg relative"
                  >
                    <img
                      :src="escudoPreview"
                      alt="Logo Preview"
                      class="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                    />
                  </div>
                  <div
                    v-else
                    class="w-24 h-24 rounded-xl flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-lg transition-colors group-hover:opacity-80"
                    :style="{ backgroundColor: editForm.color_principal }"
                  >
                    {{ editForm.nombre?.charAt(0) || "?" }}
                  </div>
                  
                  <!-- Botón para seleccionar foto -->
                  <label
                    for="escudo-input"
                    class="absolute bottom-[-8px] right-[-8px] w-8 h-8 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg transition-colors z-10"
                    title="Cambiar logotipo"
                  >
                    <CameraIcon class="w-4 h-4" />
                  </label>
                  <input
                    id="escudo-input"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleEscudoChange"
                  />
                  <!-- Botón para eliminar foto -->
                  <button
                    v-if="escudoPreview"
                    type="button"
                    @click="eliminarEscudo"
                    class="absolute top-[-8px] right-[-8px] w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors z-10"
                    title="Eliminar logotipo"
                  >
                    <XMarkIcon class="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div class="text-center">
                  <p class="font-semibold text-notion-text">
                    {{ editForm.nombre || "Nombre del equipo" }}
                  </p>
                  <div class="flex items-center justify-center gap-2 mt-1.5">
                    <div
                      class="w-4 h-4 rounded-full border border-notion-border transition-colors"
                      :style="{ backgroundColor: editForm.color_principal }"
                    ></div>
                    <div
                      class="w-4 h-4 rounded-full border border-notion-border transition-colors"
                      :style="{ backgroundColor: editForm.color_secundario }"
                    ></div>
                    <span class="text-xs text-notion-muted">Colores del equipo</span>
                  </div>
                  <p class="text-[10px] text-notion-muted mt-2">
                    JPG, PNG o GIF (Max 2MB)
                  </p>
                </div>
              </div>
            </div>

            <form @submit.prevent="saveEquipo" class="space-y-5">
              <!-- Nombre -->
              <div>
                <label class="block text-xs font-medium text-notion-text mb-1.5">Nombre del equipo</label>
                <input
                  v-model="editForm.nombre"
                  type="text"
                  required
                  class="input text-sm"
                  placeholder="Nombre del equipo"
                />
              </div>

              <!-- Colores -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-notion-text mb-1.5">Color Principal</label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model="editForm.color_principal"
                      type="color"
                      class="w-12 h-10 rounded-lg cursor-pointer border border-notion-border p-0.5"
                    />
                    <span class="text-xs text-notion-muted font-mono">{{ editForm.color_principal }}</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-notion-text mb-1.5">Color Secundario</label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model="editForm.color_secundario"
                      type="color"
                      class="w-12 h-10 rounded-lg cursor-pointer border border-notion-border p-0.5"
                    />
                    <span class="text-xs text-notion-muted font-mono">{{ editForm.color_secundario }}</span>
                  </div>
                </div>
              </div>

              <!-- Botones -->
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="btn-outline flex-1 text-sm"
                  @click="closeEditPanel"
                  :disabled="savingEquipo"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                  :disabled="savingEquipo"
                >
                  <ArrowPathIcon v-if="savingEquipo || uploadingEscudo" class="w-4 h-4 animate-spin" />
                  <CheckIcon v-else class="w-4 h-4" />
                  {{ (savingEquipo || uploadingEscudo) ? "Guardando..." : "Guardar cambios" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

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

<style scoped>
/* Backdrop fade */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* Slide-over from right */
.slideover-enter-active,
.slideover-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slideover-enter-from,
.slideover-leave-to {
  transform: translateX(100%);
}
</style>
