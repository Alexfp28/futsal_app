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
import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  DocumentIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";

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
const ingresos = ref([]);
const comprobantes = ref({});
const loading = ref(true);
const error = ref(null);
const activeTab = ref("resumen");
const selectedComprobante = ref(null);
const isModalOpen = ref(false);

// Cargar datos
onMounted(async () => {
  try {
    // Cargar gastos
    const { data: gastosData, error: gastosErr } = await supabase
      .from("gastos")
      .select("*")
      .order("fecha", { ascending: false });

    if (gastosErr) throw gastosErr;
    gastos.value = gastosData || [];

    // Cargar ingresos
    const { data: ingresosData, error: ingresosErr } = await supabase
      .from("ingresos")
      .select("*")
      .order("fecha", { ascending: false });

    if (ingresosErr) throw ingresosErr;
    ingresos.value = ingresosData || [];

    // Cargar comprobantes
    const { data: compData, error: compErr } = await supabase
      .from("comprobantes_gastos")
      .select("*");

    if (!compErr && compData) {
      const compMap = {};
      compData.forEach((c) => {
        if (!compMap[c.gasto_id]) {
          compMap[c.gasto_id] = [];
        }
        compMap[c.gasto_id].push(c);
      });
      comprobantes.value = compMap;
    }
  } catch (e) {
    error.value = "Error al cargar los datos económicos";
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

const ingresosEjemplo = [
  {
    id: 1,
    concepto: "Inscripción equipo Los Tigres",
    importe: 150,
    tipo: "inscripcion_equipo",
    fecha: "2024-01-10",
  },
  {
    id: 2,
    concepto: "Inscripción equipo Águilas FC",
    importe: 150,
    tipo: "inscripcion_equipo",
    fecha: "2024-01-10",
  },
  {
    id: 3,
    concepto: "Donación anónima",
    importe: 50,
    tipo: "donacion",
    fecha: "2024-01-25",
  },
  {
    id: 4,
    concepto: "Inscripción equipo La Vall United",
    importe: 150,
    tipo: "inscripcion_equipo",
    fecha: "2024-02-01",
  },
  {
    id: 5,
    concepto: "Patrocinio tienda local",
    importe: 200,
    tipo: "sponsor",
    fecha: "2024-02-15",
  },
  {
    id: 6,
    concepto: "Inscripción equipo Atlético Vall",
    importe: 150,
    tipo: "inscripcion_equipo",
    fecha: "2024-02-20",
  },
  {
    id: 7,
    concepto: "Donación padres jugadores",
    importe: 100,
    tipo: "donacion",
    fecha: "2024-03-01",
  },
];

const gastosActuales = computed(() =>
  gastos.value.length > 0 ? gastos.value : gastosEjemplo,
);

const ingresosActuales = computed(() =>
  ingresos.value.length > 0 ? ingresos.value : ingresosEjemplo,
);

const totalGastos = computed(() => {
  return gastosActuales.value.reduce((sum, g) => sum + Number(g.importe), 0);
});

const totalIngresos = computed(() => {
  return ingresosActuales.value.reduce((sum, i) => sum + Number(i.importe), 0);
});

const saldoTotal = computed(() => {
  return totalIngresos.value - totalGastos.value;
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

const ingresosPorTipo = computed(() => {
  const tipos = {};
  ingresosActuales.value.forEach((i) => {
    if (!tipos[i.tipo]) {
      tipos[i.tipo] = 0;
    }
    tipos[i.tipo] += Number(i.importe);
  });
  return tipos;
});

const coloresCategorias = {
  Instalaciones: "#164bf0",
  Material: "#f6ec15",
  Seguros: "#708cc5",
  Premios: "#16a34a",
  Árbitros: "#f97316",
  Otros: "#6b7280",
};

const coloresIngresos = {
  inscripcion_equipo: "#16a34a",
  donacion: "#164bf0",
  sponsor: "#f59e0b",
  otro: "#6b7280",
};

const getTipoLabel = (tipo) => {
  const labels = {
    inscripcion_equipo: "Inscripción",
    donacion: "Donación",
    sponsor: "Patrocinio",
    otro: "Otro",
  };
  return labels[tipo] || tipo;
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

const ingresosChartData = computed(() => ({
  labels: Object.keys(ingresosPorTipo.value).map(getTipoLabel),
  datasets: [
    {
      data: Object.values(ingresosPorTipo.value),
      backgroundColor: Object.keys(ingresosPorTipo.value).map(
        (tipo) => coloresIngresos[tipo] || "#6b7280",
      ),
      borderWidth: 0,
    },
  ],
}));

const gastosPorMes = computed(() => {
  const meses = {};
  gastosActuales.value.forEach((g) => {
    const mes = g.fecha.substring(0, 7);
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

const hasComprobantes = (gastoId) => {
  return comprobantes.value[gastoId] && comprobantes.value[gastoId].length > 0;
};

const openComprobante = (comp) => {
  selectedComprobante.value = comp;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedComprobante.value = null;
};
</script>

<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="page-title">Economía y Transparencia</h1>
      <p class="page-subtitle">
        Información detallada sobre ingresos y gastos de la organización
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>

    <template v-else>
      <!-- Resumen financiero -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card p-6 text-center border-l-4 border-green-500">
          <p class="text-sm text-notion-muted mb-2">Total Ingresos</p>
          <p class="text-3xl font-bold text-green-600">
            +{{ totalIngresos.toFixed(2) }}€
          </p>
        </div>
        <div class="card p-6 text-center border-l-4 border-red-500">
          <p class="text-sm text-notion-muted mb-2">Total Gastos</p>
          <p class="text-3xl font-bold text-red-600">
            -{{ totalGastos.toFixed(2) }}€
          </p>
        </div>
        <div
          class="card p-6 text-center border-l-4"
          :class="saldoTotal >= 0 ? 'border-blue-500' : 'border-orange-500'"
        >
          <p class="text-sm text-notion-muted mb-2">Saldo Total</p>
          <p
            class="text-3xl font-bold"
            :class="saldoTotal >= 0 ? 'text-blue-600' : 'text-orange-600'"
          >
            {{ saldoTotal >= 0 ? "+" : "" }}{{ saldoTotal.toFixed(2) }}€
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6">
        <button
          @click="activeTab = 'resumen'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'resumen'
              ? 'bg-primary text-white'
              : 'bg-white border border-notion-border text-notion-muted hover:bg-notion-bg',
          ]"
        >
          Resumen
        </button>
        <button
          @click="activeTab = 'ingresos'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'ingresos'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-notion-border text-notion-muted hover:bg-notion-bg',
          ]"
        >
          Ingresos
        </button>
        <button
          @click="activeTab = 'gastos'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'gastos'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-notion-border text-notion-muted hover:bg-notion-bg',
          ]"
        >
          Gastos
        </button>
      </div>

      <!-- Contenido según tab -->
      <template v-if="activeTab === 'resumen'">
        <!-- Gráficos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div class="card p-6">
            <h2
              class="text-lg font-semibold text-notion-text mb-4 flex items-center gap-2"
            >
              <ArrowUpCircleIcon class="w-5 h-5 text-green-600" />
              Ingresos por Tipo
            </h2>
            <div class="h-64">
              <Pie :data="ingresosChartData" :options="chartOptions" />
            </div>
          </div>

          <div class="card p-6">
            <h2 class="text-lg font-semibold text-notion-text mb-4">
              Gastos por Categoría
            </h2>
            <div class="h-64">
              <Pie :data="chartData" :options="chartOptions" />
            </div>
          </div>
        </div>

        <div class="card p-6 mb-8">
          <h2 class="text-lg font-semibold text-notion-text mb-4">
            Gastos por Mes
          </h2>
          <div class="h-64">
            <Bar :data="barChartData" :options="barChartOptions" />
          </div>
        </div>
      </template>

      <!-- Tab Ingresos -->
      <template v-else-if="activeTab === 'ingresos'">
        <div class="card overflow-hidden">
          <div class="p-6 border-b border-notion-border">
            <h2 class="text-lg font-semibold text-notion-text">
              Detalle de Ingresos
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
                    Tipo
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
                  v-for="ingreso in ingresosActuales"
                  :key="ingreso.id"
                  class="border-t border-notion-border hover:bg-notion-bg transition-colors"
                >
                  <td class="py-3 px-6 text-sm text-notion-muted">
                    {{ new Date(ingreso.fecha).toLocaleDateString("es-ES") }}
                  </td>
                  <td class="py-3 px-6 text-sm text-notion-text">
                    {{ ingreso.concepto }}
                  </td>
                  <td class="py-3 px-6">
                    <span class="badge badge-green text-xs">
                      {{ getTipoLabel(ingreso.tipo) }}
                    </span>
                  </td>
                  <td
                    class="py-3 px-6 text-sm text-green-600 text-right font-medium"
                  >
                    +{{ Number(ingreso.importe).toFixed(2) }}€
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- Tab Gastos -->
      <template v-else-if="activeTab === 'gastos'">
        <div class="card overflow-hidden">
          <div class="p-6 border-b border-notion-border">
            <h2
              class="text-lg font-semibold text-notion-text flex items-center gap-2"
            >
              <ArrowDownCircleIcon class="w-5 h-5 text-red-500" />
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
                  <th
                    class="text-center py-3 px-6 text-sm font-medium text-notion-muted"
                  >
                    Comprobante
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
                    <span class="badge badge-primary text-xs">
                      {{ gasto.categoria }}
                    </span>
                  </td>
                  <td
                    class="py-3 px-6 text-sm text-red-600 text-right font-medium"
                  >
                    -{{ Number(gasto.importe).toFixed(2) }}€
                  </td>
                  <td class="py-3 px-6 text-center">
                    <button
                      v-if="hasComprobantes(gasto.id)"
                      @click="openComprobante(comprobantes[gasto.id][0])"
                      class="inline-flex items-center gap-1 text-primary hover:text-primary-600 text-sm"
                    >
                      <EyeIcon class="w-4 h-4" />
                      Ver
                    </button>
                    <span v-else class="text-notion-muted text-sm">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <!-- Modal de comprobante -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @keydown.esc="closeModal"
    >
      <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-notion-text">
              Comprobante de Gasto
            </h3>
            <button
              @click="closeModal"
              class="p-1 hover:bg-notion-bg rounded-lg"
            >
              <XMarkIcon class="w-6 h-6 text-notion-muted" />
            </button>
          </div>
          <div v-if="selectedComprobante" class="space-y-3">
            <div class="flex items-center gap-2 text-notion-muted">
              <DocumentIcon class="w-5 h-5" />
              <span>{{ selectedComprobante.nombre_archivo }}</span>
            </div>
            <div class="bg-notion-bg p-4 rounded-lg">
              <p class="text-sm text-notion-muted">
                Tipo: {{ selectedComprobante.tipo_archivo }}
              </p>
              <a
                :href="selectedComprobante.url_storage"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline text-sm"
              >
                Abrir comprobante →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Nota de transparencia -->
    <div class="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
      <h3 class="font-semibold text-notion-text mb-2">
        Compromiso de Transparencia
      </h3>
      <p class="text-sm text-notion-muted">
        En FutSal La Vall nos comprometemos a mantener total transparencia sobre
        la gestión económica. Todos los ingresos y gastos son documentados y
        pueden ser consultados por cualquier miembro de la organización. Si
        tienes alguna pregunta sobre algún movimiento, contacta con la
        administración.
      </p>
    </div>
  </div>
</template>
