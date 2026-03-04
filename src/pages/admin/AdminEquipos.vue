<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/vue/24/outline";

const equipos = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingEquipo = ref(null);
const form = ref({
  nombre: "",
  color_principal: "#164bf0",
  color_secundario: "#f6ec15",
});

onMounted(async () => {
  await loadEquipos();
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
    // Datos de ejemplo
    equipos.value = [
      {
        id: 1,
        nombre: "Los Tigres",
        color_principal: "#164bf0",
        color_secundario: "#f6ec15",
        profiles: [{ nombre: "Carlos García" }],
      },
      {
        id: 2,
        nombre: "Águilas FC",
        color_principal: "#dc2626",
        color_secundario: "#ffffff",
        profiles: [{ nombre: "Miguel Torres" }],
      },
      {
        id: 3,
        nombre: "La Vall United",
        color_principal: "#16a34a",
        color_secundario: "#000000",
        profiles: [{ nombre: "Pedro Martínez" }],
      },
    ];
  } finally {
    loading.value = false;
  }
};

const openModal = (equipo = null) => {
  if (equipo) {
    editingEquipo.value = equipo;
    form.value = { ...equipo };
  } else {
    editingEquipo.value = null;
    form.value = {
      nombre: "",
      color_principal: "#164bf0",
      color_secundario: "#f6ec15",
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingEquipo.value = null;
};

const saveEquipo = async () => {
  try {
    if (editingEquipo.value) {
      await supabase
        .from("equipos")
        .update(form.value)
        .eq("id", editingEquipo.value.id);
    } else {
      await supabase.from("equipos").insert(form.value);
    }
    await loadEquipos();
    closeModal();
  } catch (e) {
    console.error("Error al guardar:", e);
  }
};

const deleteEquipo = async (id) => {
  if (confirm("¿Estás seguro de eliminar este equipo?")) {
    try {
      await supabase.from("equipos").delete().eq("id", id);
      await loadEquipos();
    } catch (e) {
      console.error("Error al eliminar:", e);
    }
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
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    :style="{ backgroundColor: equipo.color_principal }"
                  >
                    {{ equipo.nombre.charAt(0) }}
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
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-6">
        <h2 class="text-xl font-semibold text-notion-text mb-6">
          {{ editingEquipo ? "Editar Equipo" : "Nuevo Equipo" }}
        </h2>

        <form @submit.prevent="saveEquipo" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Nombre</label
            >
            <input
              v-model="form.nombre"
              type="text"
              required
              class="input"
              placeholder="Nombre del equipo"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-notion-text mb-2"
                >Color Principal</label
              >
              <input
                v-model="form.color_principal"
                type="color"
                class="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-notion-text mb-2"
                >Color Secundario</label
              >
              <input
                v-model="form.color_secundario"
                type="color"
                class="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="btn-outline flex-1"
            >
              Cancelar
            </button>
            <button type="submit" class="btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
