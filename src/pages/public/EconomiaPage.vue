<script setup>
import { ref, onMounted, computed } from "vue";
import { supabase } from "@/lib/supabase";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "vue-chartjs";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const gastos = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const { data, err } = await supabase
      .from("gastos")
      .select("*")
      .order("fecha", { ascending: false });

    if (err) throw err;
    gastos.value = data || [];
  } catch (e) {
    error.value = "Error al cargar los gastos";
    console.error(e);
  } finally {
    loading.value = false;
  }
});

// Datos de ejemplo
const gastosEjemplo = [
  {
    id: 1,
    concepto: "Alquiler polideportivo",
    importe: 450,
    categoria: "Instalaciones",
    fecha: "2024-01-15",
  },
  {
    id: 2,
    concepto: "Material deportivo",
    importe: 120,
    categoria: "Material",
    fecha: "2024-01-20",
  },
  {
    id: 3,
    concepto: "Seguros jugadores",
    importe: 200,
    categoria: "Seguros",
    fecha: "2024-02-01",
  },
  {
    id: 4,
    concepto: "Alquiler polideportivo",
    importe: 450,
    categoria: "Instalaciones",
    fecha: "2024-02-15",
  },
  {
    id: 5,
    concepto: "Trofeos y premios",
    importe: 85,
    categoria: "Premios",
    fecha: "2024-02-28",
  },
  {
    id: 6,
    concepto: "Material deportivo",
    importe: 95,
    categoria: "Material",
    fecha: "2024-03-10",
  },
  {
    id: 7,
    concepto: "Alquiler polideportivo",
    importe: 450,
    categoria: "Instalaciones",
    fecha: "2024-03-15",
  },
  {
    id: 8,
    concepto: "Árbitros",
    importe: 180,
    categoria: "Árbitros",
    fecha: "2024-03-20",
  },
];

const gastosActuales = computed(() =>
  gastos.value.length > 0 ? gastos.value : gastosEjemplo,
);

const totalGastos = computed(() => {
  return gastosActuales.value.reduce((sum, g) => sum + Number(g.importe), 0);
});

const gastosPorCategoria = computed(() => {
  const categorias = {};
  gastosActuales.value.forEach((g) => {
    if (!categorias[g.categoria]) {
      categorias[g.categoria] = 0;
    }
    categorias[g.categoria] += Number(g.importe);
  });
  return categorias;
});

const coloresCategorias = {
  Instalaciones: "#164bf0",
  Material: "#f6ec15",
  Seguros: "#708cc5",
  Premios: "#16a34a",
  Árbitros: "#f97316",
  Otros: "#6b7280",
};

const chartData = computed(() => ({
  labels: Object.keys(gastosPorCategoria.value),
  datasets: [
    {
      data: Object.values(gastosPorCategoria.value),
      backgroundColor: Object.keys(gastosPorCategoria.value).map(
        (cat) => coloresCategorias[cat] || "#6b7280",
      ),
      borderWidth: 0,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        padding: 20,
        usePointStyle: true,
      },
    },
  },
};

const gastosPorMes = computed(() => {
  const meses = {};
  gastosActuales.value.forEach((g) => {
    const mes = g.fecha.substring(0, 7); // YYYY-MM
    if (!meses[mes]) {
      meses[mes] = 0;
    }
    meses[mes] += Number(g.importe);
  });
  return meses;
});

const barChartData = computed(() => ({
  labels: Object.keys(gastosPorMes.value).map((m) => {
    const [year, month] = m.split("-");
    const meses = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return meses[parseInt(month) - 1];
  }),
  datasets: [
    {
      label: "Gastos (€)",
      data: Object.values(gastosPorMes.value),
      backgroundColor: "#164bf0",
      borderRadius: 8,
    },
  ],
}));

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `${value}€`,
      },
    },
  },
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Economía y Transparencia</h1>
      <p class="page-subtitle">
        Información detallada sobre los gastos de la organización
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <!-- Resumen -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card p-6 text-center">
          <p class="text-sm text-notion-muted mb-2">Total Gastado</p>
          <p class="text-3xl font-bold text-primary">
            {{ totalGastos.toFixed(2) }}€
          </p>
        </div>
        <div class="card p-6 text-center">
          <p class="text-sm text-notion-muted mb-2">Número de Gastos</p>
          <p class="text-3xl font-bold text-notion-text">
            {{ gastosActuales.length }}
          </p>
        </div>
        <div class="card p-6 text-center">
          <p class="text-sm text-notion-muted mb-2">Categorías</p>
          <p class="text-3xl font-bold text-notion-text">
            {{ Object.keys(gastosPorCategoria).length }}
          </p>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Gráfico circular -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-notion-text mb-4">
            Gastos por Categoría
          </h2>
          <div class="h-64">
            <Pie :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Gráfico de barras -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-notion-text mb-4">
            Gastos por Mes
          </h2>
          <div class="h-64">
            <Bar :data="barChartData" :options="barChartOptions" />
          </div>
        </div>
      </div>

      <!-- Tabla de gastos -->
      <div class="card overflow-hidden">
        <div class="p-6 border-b border-notion-border">
          <h2 class="text-lg font-semibold text-notion-text">
            Detalle de Gastos
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-notion-bg">
              <tr>
                <th
                  class="text-left py-3 px-6 text-sm font-medium text-notion-muted"
                >
                  Fecha
                </th>
                <th
                  class="text-left py-3 px-6 text-sm font-medium text-notion-muted"
                >
                  Concepto
                </th>
                <th
                  class="text-left py-3 px-6 text-sm font-medium text-notion-muted"
                >
                  Categoría
                </th>
                <th
                  class="text-right py-3 px-6 text-sm font-medium text-notion-muted"
                >
                  Importe
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="gasto in gastosActuales"
                :key="gasto.id"
                class="border-t border-notion-border hover:bg-notion-bg transition-colors"
              >
                <td class="py-3 px-6 text-sm text-notion-muted">
                  {{ new Date(gasto.fecha).toLocaleDateString("es-ES") }}
                </td>
                <td class="py-3 px-6 text-sm text-notion-text">
                  {{ gasto.concepto }}
                </td>
                <td class="py-3 px-6">
                  <span class="badge badge-primary text-xs">{{
                    gasto.categoria
                  }}</span>
                </td>
                <td
                  class="py-3 px-6 text-sm text-notion-text text-right font-medium"
                >
                  {{ Number(gasto.importe).toFixed(2) }}€
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Nota de transparencia -->
    <div class="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
      <h3 class="font-semibold text-notion-text mb-2">
        Compromiso de Transparencia
      </h3>
      <p class="text-sm text-notion-muted">
        En FutSal La Vall nos comprometemos a mantener total transparencia sobre
        la gestión económica. Todos los gastos son documentados y pueden ser
        consultados por cualquier miembro de la organización. Si tienes alguna
        pregunta sobre algún gasto, contacta con la administración.
      </p>
    </div>
  </div>
</template>
