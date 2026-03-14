<script setup>
import { ref, onMounted, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/vue/24/outline";

const gastos = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingGasto = ref(null);
const form = ref({
  concepto: "",
  importe: "",
  categoria: "Instalaciones",
  fecha: new Date().toISOString().split("T")[0],
});

const categorias = [
  "Instalaciones",
  "Material",
  "Seguros",
  "Premios",
  "Árbitros",
  "Otros",
];

const loadGastos = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("gastos")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) throw error;
    gastos.value = data || [];
  } catch (e) {
    // Datos de ejemplo
    gastos.value = [
      {
        id: 1,
        concepto: "Alquiler polideportivo",
        importe: 450,
        categoria: "Instalaciones",
        fecha: "2024-03-15",
      },
      {
        id: 2,
        concepto: "Material deportivo",
        importe: 120,
        categoria: "Material",
        fecha: "2024-03-10",
      },
      {
        id: 3,
        concepto: "Seguros jugadores",
        importe: 200,
        categoria: "Seguros",
        fecha: "2024-03-01",
      },
      {
        id: 4,
        concepto: "Trofeos y premios",
        importe: 85,
        categoria: "Premios",
        fecha: "2024-02-28",
      },
    ];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadGastos();
});

// Recargar datos cuando se navega a esta ruta
useRouteRefresh(loadGastos);

const totalGastos = computed(() => {
  return gastos.value.reduce((sum, g) => sum + Number(g.importe), 0);
});

const openModal = (gasto = null) => {
  if (gasto) {
    editingGasto.value = gasto;
    form.value = { ...gasto };
  } else {
    editingGasto.value = null;
    form.value = {
      concepto: "",
      importe: "",
      categoria: "Instalaciones",
      fecha: new Date().toISOString().split("T")[0],
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingGasto.value = null;
};

const saveGasto = async () => {
  try {
    const gastoData = {
      ...form.value,
      importe: Number(form.value.importe),
    };

    if (editingGasto.value) {
      await supabase
        .from("gastos")
        .update(gastoData)
        .eq("id", editingGasto.value.id);
    } else {
      await supabase.from("gastos").insert(gastoData);
    }
    await loadGastos();
    closeModal();
  } catch (e) {
    console.error("Error al guardar:", e);
  }
};

const deleteGasto = async (id) => {
  if (confirm("¿Estás seguro de eliminar este gasto?")) {
    try {
      await supabase.from("gastos").delete().eq("id", id);
      gastos.value = gastos.value.filter((g) => g.id !== id);
    } catch (e) {
      console.error("Error al eliminar:", e);
    }
  }
};

const formatDate = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-ES");
};

const getCategoriaColor = (categoria) => {
  const colores = {
    Instalaciones: "bg-primary/10 text-primary",
    Material: "bg-secondary/20 text-notion-text",
    Seguros: "bg-tertiary/20 text-tertiary",
    Premios: "bg-green-100 text-green-600",
    Árbitros: "bg-orange-100 text-orange-600",
    Otros: "bg-gray-100 text-gray-600",
  };
  return colores[categoria] || "bg-gray-100 text-gray-600";
};
</script>

<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="page-title">Gestionar Gastos</h1>
        <p class="page-subtitle">
          Registra y controla los gastos de la organización
        </p>
      </div>
      <button
        @click="openModal()"
        class="btn-primary flex items-center space-x-2"
      >
        <PlusIcon class="w-5 h-5" />
        <span>Nuevo Gasto</span>
      </button>
    </div>

    <!-- Resumen -->
    <div class="card p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-notion-muted">Total de Gastos</p>
          <p class="text-3xl font-bold text-notion-text">
            {{ totalGastos.toFixed(2) }}€
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm text-notion-muted">{{ gastos.length }} registros</p>
        </div>
      </div>
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
                Fecha
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Concepto
              </th>
              <th
                class="text-left py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Categoría
              </th>
              <th
                class="text-right py-4 px-6 text-sm font-medium text-notion-muted"
              >
                Importe
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
              v-for="gasto in gastos"
              :key="gasto.id"
              class="border-t border-notion-border hover:bg-notion-bg transition-colors"
            >
              <td class="py-4 px-6 text-sm text-notion-muted">
                {{ formatDate(gasto.fecha) }}
              </td>
              <td class="py-4 px-6 text-notion-text">
                {{ gasto.concepto }}
              </td>
              <td class="py-4 px-6">
                <span :class="['badge', getCategoriaColor(gasto.categoria)]">
                  {{ gasto.categoria }}
                </span>
              </td>
              <td class="py-4 px-6 text-right font-medium text-notion-text">
                {{ Number(gasto.importe).toFixed(2) }}€
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="openModal(gasto)"
                    class="p-2 text-notion-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteGasto(gasto.id)"
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
          {{ editingGasto ? "Editar Gasto" : "Nuevo Gasto" }}
        </h2>

        <form @submit.prevent="saveGasto" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Concepto</label
            >
            <input
              v-model="form.concepto"
              type="text"
              required
              class="input"
              placeholder="Descripción del gasto"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Importe (€)</label
            >
            <input
              v-model="form.importe"
              type="number"
              step="0.01"
              min="0"
              required
              class="input"
              placeholder="0.00"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Categoría</label
            >
            <select v-model="form.categoria" class="input">
              <option v-for="cat in categorias" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-notion-text mb-2"
              >Fecha</label
            >
            <input v-model="form.fecha" type="date" required class="input" />
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
