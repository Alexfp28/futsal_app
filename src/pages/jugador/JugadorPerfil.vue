<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  UserIcon,
  PencilIcon,
  CameraIcon,
  XMarkIcon,
  CheckIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  InboxIcon,
} from "@heroicons/vue/24/outline";

const authStore = useAuthStore();
const perfil = ref(null);
const equipos = ref([]);
const solicitudesEnviadas = ref([]);
const solicitudesRecibidas = ref([]);
const loading = ref(true);
const editing = ref(false);
const showSolicitarModal = ref(false);
const uploading = ref(false);
const processingSolicitud = ref(false);

const form = ref({
  nombre: "",
  posicion: "",
  numero_camiseta: "",
  foto_url: "",
});

const fotoPreview = ref(null);
const fotoFile = ref(null);

const posiciones = ["Portero", "Defensa", "Ala", "Cierre", "Universal"];

const loadData = async () => {
  loading.value = true;
  try {
    // Cargar perfil - primero sin relación para obtener todos los campos
    const { data: perfilData, error: perfilError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authStore.user.id)
      .single();

    if (perfilError) throw perfilError;

    // Si tiene equipo, cargar la información del equipo por separado
    if (perfilData.equipo_id) {
      const { data: equipoData } = await supabase
        .from("equipos")
        .select("nombre, color_principal")
        .eq("id", perfilData.equipo_id)
        .single();

      if (equipoData) {
        perfilData.equipos = equipoData;
      }
    }

    perfil.value = perfilData;
    form.value = {
      nombre: perfilData?.nombre || "",
      posicion: perfilData?.posicion || "",
      numero_camiseta: perfilData?.numero_camiseta || "",
      foto_url: perfilData?.foto_url || "",
    };
    fotoPreview.value = perfilData?.foto_url || null;

    // Cargar equipos disponibles para solicitar (excluyendo el actual)
    const { data: equiposData } = await supabase
      .from("equipos")
      .select("id, nombre, color_principal")
      .neq(
        "id",
        perfilData?.equipo_id || "00000000-0000-0000-0000-000000000000",
      );

    equipos.value = equiposData || [];

    // Cargar solicitudes del jugador (enviadas por el jugador)
    const { data: solicitudesEnviadasData, error: envError } = await supabase
      .from("solicitudes_fichaje")
      .select(
        "id, jugador_id, equipo_id, origen, estado, created_at, equipos(nombre)",
      )
      .eq("jugador_id", authStore.user.id)
      .eq("origen", "jugador")
      .order("created_at", { ascending: false });

    if (envError)
      console.error("Error cargando solicitudes enviadas:", envError);
    solicitudesEnviadas.value = solicitudesEnviadasData || [];

    // Cargar solicitudes recibidas de equipos
    const { data: solicitudesRecibidasData, error: recError } = await supabase
      .from("solicitudes_fichaje")
      .select(
        "id, jugador_id, equipo_id, origen, estado, created_at, equipos(nombre)",
      )
      .eq("jugador_id", authStore.user.id)
      .eq("origen", "equipo")
      .order("created_at", { ascending: false });

    if (recError)
      console.error("Error cargando solicitudes recibidas:", recError);
    solicitudesRecibidas.value = solicitudesRecibidasData || [];
  } catch (e) {
    console.error("Error cargando datos:", e);
    // Datos de ejemplo
    perfil.value = {
      nombre: authStore.userName || "Jugador",
      posicion: "Ala",
      numero_camiseta: 7,
      libre: true,
      equipos: null,
      foto_url: null,
    };
    form.value = {
      nombre: perfil.value.nombre,
      posicion: perfil.value.posicion,
      numero_camiseta: perfil.value.numero_camiseta,
      foto_url: "",
    };
    equipos.value = [
      { id: 1, nombre: "Los Tigres", color_principal: "#164bf0" },
      { id: 2, nombre: "Águilas FC", color_principal: "#dc2626" },
      { id: 3, nombre: "La Vall United", color_principal: "#16a34a" },
    ];
    solicitudesEnviadas.value = [
      {
        id: 1,
        estado: "pendiente",
        origen: "jugador",
        equipos: { nombre: "Los Tigres" },
      },
    ];
    solicitudesRecibidas.value = [
      {
        id: 2,
        estado: "pendiente",
        origen: "equipo",
        equipos: { nombre: "Águilas FC" },
      },
    ];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadData();
});

// Recargar datos cuando se navega a esta ruta
useRouteRefresh(loadData);

// Solicitudes pendientes recibidas (solo mostrar en "Invitaciones de Equipos")
const solicitudesRecibidasPendientes = computed(() =>
  solicitudesRecibidas.value.filter((s) => s.estado === "pendiente"),
);

// Combinar solicitudes enviadas y recibidas procesadas (para "Mis Solicitudes")
const todasLasSolicitudes = computed(() => {
  const enviadas = solicitudesEnviadas.value.map((s) => ({
    ...s,
    tipo: "enviada",
  }));
  const recibidas = solicitudesRecibidas.value.map((s) => ({
    ...s,
    tipo: "recibida",
  }));
  return [...enviadas, ...recibidas];
});

const isJugadorLibre = computed(
  () => perfil.value?.libre === true || !perfil.value?.equipo_id,
);

const tieneEquipo = computed(
  () => !!perfil.value?.equipo_id && !!perfil.value?.equipos,
);

// Manejar selección de archivo de imagen
const handleFotoChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no puede superar los 2MB");
      return;
    }

    fotoFile.value = file;
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      fotoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Subir imagen a Supabase Storage
const uploadFoto = async (userId) => {
  if (!fotoFile.value) return null;

  uploading.value = true;
  try {
    const bucketName = "fotos-perfil";

    // Intentar crear el bucket si no existe (puede fallar si ya existe o no hay permisos)
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === bucketName);

      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
        });
      }
    } catch (bucketError) {
      // Si falla al verificar/crear, continuamos asumiendo que el bucket existe
      console.warn(
        "No se pudo verificar/crear bucket, intentando subir de todas formas:",
        bucketError,
      );
    }

    // Subir archivo con nombre único
    const fileExt = fotoFile.value.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fotoFile.value, {
        upsert: true,
        contentType: fotoFile.value.type,
      });

    if (error) {
      console.error("Error en upload:", error);
      throw error;
    }

    // Obtener URL pública
    const { data: urlData, error: urlError } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (urlError) {
      console.error("Error obteniendo URL:", urlError);
      throw urlError;
    }

    return urlData.publicUrl;
  } catch (e) {
    console.error("Error subiendo imagen:", e);
    alert("Error al subir la imagen. Por favor, inténtalo de nuevo.");
    return null;
  } finally {
    uploading.value = false;
  }
};

// Eliminar foto de perfil
const eliminarFoto = async () => {
  // Si hay una foto anterior en el perfil, eliminarla del storage
  if (
    perfil.value?.foto_url &&
    perfil.value.foto_url.includes("fotos-perfil")
  ) {
    try {
      const fileName = perfil.value.foto_url.split("/").pop();
      await supabase.storage.from("fotos-perfil").remove([fileName]);
    } catch (e) {
      console.warn("No se pudo eliminar la foto anterior:", e);
    }
  }
  fotoFile.value = null;
  fotoPreview.value = null;
  form.value.foto_url = "";
};

const saveProfile = async () => {
  try {
    // Verificar que authStore.user.id existe
    if (!authStore.user?.id) {
      console.error("No hay usuario autenticado");
      return;
    }

    let fotoUrl = form.value.foto_url;

    // Si hay una nueva foto, subirla
    if (fotoFile.value) {
      const uploadedUrl = await uploadFoto(authStore.user.id);
      if (uploadedUrl) {
        fotoUrl = uploadedUrl;
      }
    }

    // Preparar datos para enviar
    const updates = {
      nombre: form.value.nombre,
      posicion: form.value.posicion || null,
      numero_camiseta: form.value.numero_camiseta
        ? parseInt(form.value.numero_camiseta, 10)
        : null,
      foto_url: fotoUrl || null,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", authStore.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error de Supabase:", error);
      throw error;
    }

    console.log("Perfil actualizado correctamente:", data);
    perfil.value = { ...perfil.value, ...updates };
    fotoFile.value = null; // Limpiar archivo después de subir
    editing.value = false;
  } catch (e) {
    console.error("Error al guardar:", e);
    // Guardar localmente aunque haya error
    perfil.value = { ...perfil.value, ...form.value };
    editing.value = false;
  }
};

const solicitarEquipo = async (equipoId) => {
  try {
    await supabase.from("solicitudes_fichaje").insert({
      jugador_id: authStore.user.id,
      equipo_id: equipoId,
      origen: "jugador",
      estado: "pendiente",
    });

    await loadData();
    showSolicitarModal.value = false;
  } catch (e) {
    console.error("Error al solicitar:", e);
    // Simular solicitud
    const equipo = equipos.value.find((e) => e.id === equipoId);
    solicitudesEnviadas.value.push({
      id: Date.now(),
      origen: "jugador",
      estado: "pendiente",
      equipos: { nombre: equipo.nombre },
    });
    showSolicitarModal.value = false;
  }
};

// Aceptar solicitud de un equipo
const aceptarSolicitud = async (solicitud) => {
  if (processingSolicitud.value) return;
  processingSolicitud.value = true;

  try {
    // Actualizar estado de la solicitud
    const { error: solicitudError } = await supabase
      .from("solicitudes_fichaje")
      .update({ estado: "aceptada" })
      .eq("id", solicitud.id);

    if (solicitudError) {
      console.error("Error al actualizar solicitud:", solicitudError);
      throw solicitudError;
    }

    // Actualizar el perfil del jugador con el equipo
    const { error: perfilError } = await supabase
      .from("profiles")
      .update({
        equipo_id: solicitud.equipo_id,
        libre: false,
      })
      .eq("id", authStore.user.id);

    if (perfilError) {
      console.error("Error al actualizar perfil:", perfilError);
      throw perfilError;
    }

    // Agregar a plantilla como titular por defecto (si no existe ya)
    await supabase.from("plantilla").insert({
      equipo_id: solicitud.equipo_id,
      jugador_id: authStore.user.id,
      es_titular: true,
      posicion_plantilla: 0,
    });

    await loadData();
  } catch (e) {
    console.error("Error al aceptar solicitud:", e);
    // Simular aceptación solo si no hay equipo ya asignado
    if (!perfil.value?.equipo_id) {
      solicitud.estado = "aceptada";
      perfil.value.equipo_id = solicitud.equipo_id;
      perfil.value.libre = false;
    }
  } finally {
    processingSolicitud.value = false;
  }
};

// Rechazar solicitud de un equipo
const rechazarSolicitud = async (solicitud) => {
  if (processingSolicitud.value) return;
  processingSolicitud.value = true;

  try {
    const { error } = await supabase
      .from("solicitudes_fichaje")
      .update({ estado: "rechazada" })
      .eq("id", solicitud.id);

    if (error) {
      console.error("Error al rechazar solicitud:", error);
      throw error;
    }

    await loadData();
  } catch (e) {
    console.error("Error al rechazar solicitud:", e);
    // Simular rechazo
    solicitud.estado = "rechazada";
  } finally {
    processingSolicitud.value = false;
  }
};

const getEstadoClass = (estado) => {
  switch (estado) {
    case "pendiente":
      return "badge-warning";
    case "aceptada":
      return "badge-success";
    case "rechazada":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
};

// Inicializar edición - cargar datos actuales
const startEditing = () => {
  form.value = {
    nombre: perfil.value?.nombre || "",
    posicion: perfil.value?.posicion || "",
    numero_camiseta: perfil.value?.numero_camiseta || "",
    foto_url: perfil.value?.foto_url || "",
  };
  fotoPreview.value = perfil.value?.foto_url || null;
  fotoFile.value = null;
  editing.value = true;
};

// Cancelar edición
const cancelEditing = () => {
  editing.value = false;
  fotoFile.value = null;
  fotoPreview.value = perfil.value?.foto_url || null;
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Mi Perfil</h1>
      <p class="page-subtitle">Gestiona tu información y solicitudes</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Perfil -->
        <div class="lg:col-span-2">
          <div class="card p-6">
            <!-- Header del perfil -->
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center space-x-4">
                <!-- Foto de perfil -->
                <div class="relative">
                  <div
                    v-if="fotoPreview"
                    class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg"
                  >
                    <img
                      :src="fotoPreview"
                      alt="Foto de perfil"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                  >
                    <UserIcon class="w-12 h-12 text-primary" />
                  </div>
                  <!-- Indicador de edición de foto -->
                  <div
                    v-if="editing"
                    class="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-md"
                  >
                    <CameraIcon class="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-notion-text">
                    {{ perfil?.nombre }}
                  </h2>
                  <div class="flex items-center space-x-2 mt-1">
                    <span
                      class="badge"
                      :class="
                        isJugadorLibre ? 'badge-warning' : 'badge-success'
                      "
                    >
                      {{ isJugadorLibre ? "Jugador Libre" : "En Equipo" }}
                    </span>
                  </div>
                </div>
              </div>
              <button
                v-if="!editing"
                @click="startEditing"
                class="btn-outline text-lg"
              >
                <PencilIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Form -->
            <form
              v-if="editing"
              @submit.prevent="saveProfile"
              class="space-y-4"
            >
              <!-- Input de foto (oculto, controlado por el icono) -->
              <div class="flex flex-col items-center mb-6">
                <div class="relative">
                  <div
                    v-if="fotoPreview"
                    class="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg"
                  >
                    <img
                      :src="fotoPreview"
                      alt="Preview"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="w-32 h-32 rounded-full bg-notion-bg flex items-center justify-center border-4 border-dashed border-notion-muted"
                  >
                    <UserIcon class="w-12 h-12 text-notion-muted" />
                  </div>
                  <!-- Botón para seleccionar foto -->
                  <label
                    for="foto-input"
                    class="absolute bottom-0 right-0 w-10 h-10 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg transition-colors"
                  >
                    <CameraIcon class="w-5 h-5" />
                  </label>
                  <input
                    id="foto-input"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFotoChange"
                  />
                  <!-- Botón eliminar foto -->
                  <button
                    v-if="fotoPreview"
                    type="button"
                    @click="eliminarFoto"
                    class="absolute top-0 right-0 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-xs text-notion-muted mt-2">
                  Toca el icono para cambiar la foto (max 2MB)
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-notion-text mb-2"
                  >Nombre completo</label
                >
                <input
                  v-model="form.nombre"
                  type="text"
                  required
                  class="input"
                  placeholder="Tu nombre"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-notion-text mb-2"
                    >Posición</label
                  >
                  <select v-model="form.posicion" class="input">
                    <option value="">Sin posición</option>
                    <option v-for="pos in posiciones" :key="pos" :value="pos">
                      {{ pos }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-notion-text mb-2"
                    >Número de camiseta</label
                  >
                  <input
                    v-model="form.numero_camiseta"
                    type="number"
                    min="1"
                    max="99"
                    class="input"
                    placeholder="Ej: 7"
                  />
                </div>
              </div>
              <div class="flex space-x-3 pt-4">
                <button
                  type="button"
                  @click="cancelEditing"
                  class="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn-primary flex-1"
                  :disabled="uploading"
                >
                  {{ uploading ? "Guardando..." : "Guardar" }}
                </button>
              </div>
            </form>

            <!-- Info (vista sin editar) -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-notion-bg rounded-lg">
                  <p class="text-sm text-notion-muted">Posición</p>
                  <p class="font-medium text-notion-text">
                    {{ perfil?.posicion || "Sin definir" }}
                  </p>
                </div>
                <div class="p-4 bg-notion-bg rounded-lg">
                  <p class="text-sm text-notion-muted">Número</p>
                  <p class="font-medium text-notion-text">
                    {{ perfil?.numero_camiseta || "Sin definir" }}
                  </p>
                </div>
              </div>

              <!-- Equipo actual -->
              <div v-if="tieneEquipo" class="p-4 bg-notion-bg rounded-lg">
                <p class="text-sm text-notion-muted mb-2">Equipo Actual</p>
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    :style="{
                      backgroundColor:
                        perfil.equipos.color_principal || '#164bf0',
                    }"
                  >
                    {{ perfil.equipos.nombre?.charAt(0) }}
                  </div>
                  <span class="font-medium text-notion-text">{{
                    perfil.equipos.nombre
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Solicitudes -->
        <div class="lg:col-span-1">
          <!-- Solicitudes Recibidas del Equipo (solo pendientes) -->
          <div
            v-if="solicitudesRecibidasPendientes.length > 0"
            class="card p-6 mb-4"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2">
                <InboxIcon class="w-5 h-5 text-primary" />
                <h3 class="font-semibold text-notion-text">
                  Invitaciones de Equipos
                </h3>
              </div>
            </div>

            <div class="space-y-3">
              <div
                v-for="solicitud in solicitudesRecibidasPendientes"
                :key="solicitud.id"
                class="p-3 bg-primary/5 border border-primary/20 rounded-lg"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-notion-text text-sm">
                    {{ solicitud.equipos?.nombre }}
                  </span>
                  <span
                    :class="['badge text-xs', getEstadoClass(solicitud.estado)]"
                  >
                    {{ solicitud.estado }}
                  </span>
                </div>
                <!-- Botones de acción para solicitudes pendientes del equipo -->
                <div
                  v-if="solicitud.estado === 'pendiente'"
                  class="flex space-x-2 mt-2"
                >
                  <button
                    @click="aceptarSolicitud(solicitud)"
                    :disabled="processingSolicitud"
                    class="flex-1 flex items-center justify-center space-x-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1.5 px-2 rounded transition-colors disabled:opacity-50"
                  >
                    <CheckIcon class="w-3.5 h-3.5" />
                    <span>Aceptar</span>
                  </button>
                  <button
                    @click="rechazarSolicitud(solicitud)"
                    :disabled="processingSolicitud"
                    class="flex-1 flex items-center justify-center space-x-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-2 rounded transition-colors disabled:opacity-50"
                  >
                    <XCircleIcon class="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Mis Solicitudes a Equipos (enviadas + recibidas procesadas) -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2">
                <PaperAirplaneIcon class="w-5 h-5 text-notion-muted" />
                <h3 class="font-semibold text-notion-text">Mis Solicitudes</h3>
              </div>
              <button
                v-if="isJugadorLibre"
                @click="showSolicitarModal = true"
                class="btn-primary text-xs py-1 px-3"
              >
                Solicitar equipo
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="solicitud in todasLasSolicitudes"
                :key="solicitud.id"
                class="p-3 bg-notion-bg rounded-lg"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-notion-text text-sm">
                      {{ solicitud.equipos?.nombre }}
                    </span>
                    <span
                      v-if="solicitud.tipo === 'recibida'"
                      class="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                    >
                      Recibida
                    </span>
                    <span
                      v-else
                      class="text-xs bg-notion-muted/20 text-notion-muted px-1.5 py-0.5 rounded"
                    >
                      Enviada
                    </span>
                  </div>
                  <span
                    :class="['badge text-xs', getEstadoClass(solicitud.estado)]"
                  >
                    {{ solicitud.estado }}
                  </span>
                </div>
              </div>
              <div
                v-if="todasLasSolicitudes.length === 0"
                class="text-center py-4 text-notion-muted text-sm"
              >
                No tienes solicitudes enviadas
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Solicitar Equipo -->
    <div
      v-if="showSolicitarModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-6">
        <h2 class="text-xl font-semibold text-notion-text mb-6">
          Solicitar unirse a equipo
        </h2>

        <div class="space-y-3">
          <button
            v-for="equipo in equipos"
            :key="equipo.id"
            @click="solicitarEquipo(equipo.id)"
            class="w-full flex items-center space-x-3 p-4 bg-notion-bg rounded-lg hover:bg-primary/5 transition-colors"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              :style="{ backgroundColor: equipo.color_principal }"
            >
              {{ equipo.nombre.charAt(0) }}
            </div>
            <span class="font-medium text-notion-text">{{
              equipo.nombre
            }}</span>
          </button>
        </div>

        <button
          @click="showSolicitarModal = false"
          class="w-full mt-4 btn-outline"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>
