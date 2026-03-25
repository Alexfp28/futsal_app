<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CameraIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";

const BUCKET = "escudos-equipo";

const equipos = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingEquipo = ref(null);
const capitanes = ref([]);
const errorMsg = ref("");

const form = ref({
  nombre: "",
  color_principal: "#164bf0",
  color_secundario: "#f6ec15",
  capitan_id: "",
  escudo_url: "",
});

// Estado de imagen
const escudoPreview = ref(null);
const escudoFile = ref(null);
const escudoInputRef = ref(null);

onMounted(async () => {
  await loadEquipos();
  await loadCapitanes();
});

useRouteRefresh(async () => {
  await Promise.all([loadEquipos(), loadCapitanes()]);
});

const loadEquipos = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("equipos")
      .select("*, profiles!equipos_capitan_id_fkey(nombre)")
      .order("nombre");

    if (error) throw error;
    equipos.value = data || [];
  } catch (e) {
    console.error("Error al cargar equipos:", e);
    equipos.value = [];
  } finally {
    loading.value = false;
  }
};

const loadCapitanes = async () => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre")
      .eq("rol", "capitan")
      .order("nombre");

    if (error) throw error;
    capitanes.value = data || [];
  } catch (e) {
    console.error("Error al cargar capitanes:", e);
    capitanes.value = [];
  }
};

const openModal = (equipo = null) => {
  errorMsg.value = "";
  escudoFile.value = null;

  if (equipo) {
    editingEquipo.value = equipo;
    form.value = {
      nombre: equipo.nombre,
      color_principal: equipo.color_principal,
      color_secundario: equipo.color_secundario,
      capitan_id: equipo.capitan_id || "",
      escudo_url: equipo.escudo_url || "",
    };
    escudoPreview.value = equipo.escudo_url || null;
  } else {
    editingEquipo.value = null;
    form.value = {
      nombre: "",
      color_principal: "#164bf0",
      color_secundario: "#f6ec15",
      capitan_id: "",
      escudo_url: "",
    };
    escudoPreview.value = null;
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingEquipo.value = null;
  escudoFile.value = null;
  escudoPreview.value = null;
  errorMsg.value = "";
};

// ==================== IMAGEN ====================

const handleEscudoChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    errorMsg.value = "Por favor selecciona un archivo de imagen válido.";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    errorMsg.value = "La imagen no puede superar los 2 MB.";
    return;
  }

  errorMsg.value = "";
  escudoFile.value = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    escudoPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const clearEscudo = () => {
  escudoFile.value = null;
  escudoPreview.value = null;
  form.value.escudo_url = "";
  if (escudoInputRef.value) escudoInputRef.value.value = "";
};

const uploadEscudo = async (equipoId) => {
  if (!escudoFile.value) return null;

  const fileExt = escudoFile.value.name.split(".").pop();
  const fileName = `equipo-${equipoId}-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, escudoFile.value, {
      upsert: true,
      contentType: escudoFile.value.type,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return urlData.publicUrl;
};

const syncCapitanProfile = async (capitanId, equipoId) => {
  if (!capitanId || !equipoId) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      equipo_id: equipoId,
      libre: false,
    })
    .eq("id", capitanId);

  if (error) throw error;
};

// ==================== GUARDAR ====================

const saveEquipo = async () => {
  errorMsg.value = "";
  saving.value = true;

  try {
    const baseData = {
      nombre: form.value.nombre.trim(),
      color_principal: form.value.color_principal,
      color_secundario: form.value.color_secundario,
      capitan_id: form.value.capitan_id || null,
    };

    if (editingEquipo.value) {
      // --- EDICIÓN ---
      let escudoUrl = form.value.escudo_url || null;

      if (escudoFile.value) {
        escudoUrl = await uploadEscudo(editingEquipo.value.id);
      }

      const { error } = await supabase
        .from("equipos")
        .update({ ...baseData, escudo_url: escudoUrl })
        .eq("id", editingEquipo.value.id);

      if (error) throw error;
      await syncCapitanProfile(baseData.capitan_id, editingEquipo.value.id);
    } else {
      // --- INSERCIÓN: primero insertar, luego subir imagen con el ID generado ---
      const { data: inserted, error: insertError } = await supabase
        .from("equipos")
        .insert(baseData)
        .select("id")
        .single();

      if (insertError) throw insertError;

      if (escudoFile.value) {
        const escudoUrl = await uploadEscudo(inserted.id);
        if (escudoUrl) {
          const { error: updateError } = await supabase
            .from("equipos")
            .update({ escudo_url: escudoUrl })
            .eq("id", inserted.id);

          if (updateError) throw updateError;
        }
      }

      await syncCapitanProfile(baseData.capitan_id, inserted.id);
    }

    await loadEquipos();
    closeModal();
  } catch (e) {
    console.error("Error al guardar equipo:", e);
    errorMsg.value = e?.message || "Error al guardar el equipo. Inténtalo de nuevo.";
  } finally {
    saving.value = false;
  }
};

const deleteEquipo = async (id) => {
  if (!confirm("¿Estás seguro de eliminar este equipo?")) return;
  try {
    const { error } = await supabase.from("equipos").delete().eq("id", id);
    if (error) throw error;
    await loadEquipos();
  } catch (e) {
    console.error("Error al eliminar:", e);
    alert(e?.message || "No se pudo eliminar el equipo.");
  }
};
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="page-title">Gestionar Equipos</h1>
        <p class="page-subtitle">
          Crea, edita y elimina equipos de la organización
        </p>
      </div>
      <button
        @click="openModal()"
        class="btn-primary flex items-center space-x-2"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Nuevo Equipo</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-notion-bg">
            <tr>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Equipo
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Colores
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Capitán
              </th>
              <th
                class="text-right py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="equipo in equipos"
              :key="equipo.id"
              class="border-t border-notion-border hover:bg-notion-bg transition-colors"
            >
              <td class="py-4 px-6">
                <div class="flex items-center space-x-3">
                  <!-- Escudo o letra inicial -->
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                    :style="{ backgroundColor: equipo.color_principal }"
                  >
                    <img
                      v-if="equipo.escudo_url"
                      :src="equipo.escudo_url"
                      :alt="equipo.nombre"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-white font-bold">
                      {{ equipo.nombre.charAt(0) }}
                    </span>
                  </div>
                  <span class="font-medium text-notion-text">{{
                    equipo.nombre
                  }}</span>
                </div>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center space-x-2">
                  <div
                    class="w-5 h-5 rounded-full border border-notion-border"
                    :style="{ backgroundColor: equipo.color_principal }"
                  ></div>
                  <div
                    class="w-5 h-5 rounded-full border border-notion-border"
                    :style="{ backgroundColor: equipo.color_secundario }"
                  ></div>
                </div>
              </td>
              <td class="py-4 px-6 text-sm text-notion-muted">
                {{
                  equipo.profiles?.[0]?.nombre ||
                  equipo.profiles?.nombre ||
                  "Sin asignar"
                }}
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="openModal(equipo)"
                    class="p-2 text-notion-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteEquipo(equipo.id)"
                    class="p-2 text-notion-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="equipos.length === 0">
              <td colspan="4" class="py-12 text-center text-notion-muted text-sm">
                No hay equipos registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-semibold text-notion-text mb-6">
          {{ editingEquipo ? "Editar Equipo" : "Nuevo Equipo" }}
        </h2>

        <form @submit.prevent="saveEquipo" class="space-y-5">

          <!-- Escudo -->
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              Escudo del equipo
            </label>

            <!-- Preview + controles -->
            <div class="flex items-center gap-4">
              <!-- Vista previa -->
              <div
                class="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-notion-border"
                :style="{ backgroundColor: form.color_principal }"
              >
                <img
                  v-if="escudoPreview"
                  :src="escudoPreview"
                  alt="Vista previa"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-white text-2xl font-bold">
                  {{ form.nombre ? form.nombre.charAt(0).toUpperCase() : "?" }}
                </span>
              </div>

              <!-- Botones -->
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  @click="escudoInputRef.click()"
                  class="btn-outline flex items-center gap-2 text-sm py-2"
                >
                  <CameraIcon class="w-4 h-4" />
                  {{ escudoPreview ? "Cambiar imagen" : "Subir imagen" }}
                </button>
                <button
                  v-if="escudoPreview"
                  type="button"
                  @click="clearEscudo"
                  class="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  <XMarkIcon class="w-4 h-4" />
                  Eliminar imagen
                </button>
              </div>
            </div>

            <!-- Input file oculto -->
            <input
              ref="escudoInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleEscudoChange"
            />
            <p class="text-xs text-notion-muted mt-2">
              JPG, PNG o WEBP · Máx. 2 MB
            </p>
          </div>

          <!-- Nombre -->
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              Nombre
            </label>
            <input
              v-model="form.nombre"
              type="text"
              required
              class="input"
              placeholder="Nombre del equipo"
            />
          </div>

          <!-- Colores -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">
                Color Principal
              </label>
              <input
                v-model="form.color_principal"
                type="color"
                class="w-full h-10 rounded-lg cursor-pointer border border-notion-border"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-notion-text mb-2">
                Color Secundario
              </label>
              <input
                v-model="form.color_secundario"
                type="color"
                class="w-full h-10 rounded-lg cursor-pointer border border-notion-border"
              />
            </div>
          </div>

          <!-- Capitán -->
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2">
              Capitán
            </label>
            <select v-model="form.capitan_id" class="input">
              <option value="">Sin asignar</option>
              <option
                v-for="capitan in capitanes"
                :key="capitan.id"
                :value="capitan.id"
              >
                {{ capitan.nombre }}
              </option>
            </select>
          </div>

          <!-- Error -->
          <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {{ errorMsg }}
          </p>

          <!-- Acciones -->
          <div class="flex space-x-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="btn-outline flex-1"
              :disabled="saving"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-primary flex-1 flex items-center justify-center gap-2"
              :disabled="saving"
            >
              <span
                v-if="saving"
                class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
              ></span>
              {{ saving ? "Guardando..." : "Guardar" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
