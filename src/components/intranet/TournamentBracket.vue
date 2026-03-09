<script setup>
import { ref, onMounted, watchEffect } from "vue";
import { supabase } from "@/lib/supabase";
import { VueFlow, useVueFlow, Position, Handle } from "@vue-flow/core";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";

const loading = ref(true);
const error = ref("");
const teams = ref([]);

// Hasta 8 equipos en el cuadro (cuartos de final)
const bracketSlots = ref(Array(8).fill(null));

const nodes = ref([]);
const edges = ref([]);

const fetchTeams = async () => {
  loading.value = true;
  error.value = "";

  try {
    const { data, error: supabaseError } = await supabase
      .from("equipos")
      .select("id, nombre, escudo_url, color_principal")
      .order("nombre", { ascending: true });

    if (supabaseError) throw supabaseError;

    teams.value = (data || []).slice(0, 8);
  } catch (e) {
    console.error("Error cargando equipos para torneo:", e);
    error.value =
      "No se pudieron cargar los equipos del torneo. Inténtalo de nuevo más tarde.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchTeams);

const shuffleTeams = () => {
  if (!teams.value.length) return;

  const source = [...teams.value];

  for (let i = source.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [source[i], source[j]] = [source[j], source[i]];
  }

  const slots = Array(8).fill(null);
  for (let i = 0; i < source.length && i < 8; i += 1) {
    slots[i] = source[i];
  }
  bracketSlots.value = slots;
};

// Configuración de Vue Flow
const { onInit, fitView } = useVueFlow();

onInit((vueFlowInstance) => {
  vueFlowInstance.fitView();
});

watchEffect(() => {
  const slots = bracketSlots.value;

  const createMatchNode = (id, label, x, y, teams = [], isRoot = false, isLeaf = false) => ({
    id,
    type: "match", // Usaremos un custom node type
    position: { x, y },
    data: { label, teams, isRoot, isLeaf },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: false, // Bloquear movimiento para mantener estructura
    connectable: false, // No permitir conexiones manuales
  });

  // Nodos de Cuartos de Final (Nivel 1)
  // Espaciado vertical base: 150px
  const qfNodes = [
    createMatchNode("qf-1", "Cuartos 1", 0, 0, [slots[0], slots[1]], true),
    createMatchNode("qf-2", "Cuartos 2", 0, 150, [slots[2], slots[3]], true),
    createMatchNode("qf-3", "Cuartos 3", 0, 300, [slots[4], slots[5]], true),
    createMatchNode("qf-4", "Cuartos 4", 0, 450, [slots[6], slots[7]], true),
  ];

  // Nodos de Semifinales (Nivel 2)
  // X = 300 (espaciado horizontal)
  // Y = Promedio de los nodos fuente
  // SF1 entre QF1(0) y QF2(150) -> 75
  // SF2 entre QF3(300) y QF4(450) -> 375
  const sfNodes = [
    createMatchNode("sf-1", "Semifinal 1", 300, 75, [], false),
    createMatchNode("sf-2", "Semifinal 2", 300, 375, [], false),
  ];

  // Nodo Final (Nivel 3)
  // X = 600
  // Y = Promedio de SF1(75) y SF2(375) -> 225
  const finalNode = [
    createMatchNode("f-1", "Final", 600, 225, [], false, true),
  ];

  nodes.value = [...qfNodes, ...sfNodes, ...finalNode];

  // Definir conexiones fijas
  edges.value = [
    { id: "e1-1", source: "qf-1", target: "sf-1", type: "smoothstep", animated: true },
    { id: "e1-2", source: "qf-2", target: "sf-1", type: "smoothstep", animated: true },
    { id: "e2-1", source: "qf-3", target: "sf-2", type: "smoothstep", animated: true },
    { id: "e2-2", source: "qf-4", target: "sf-2", type: "smoothstep", animated: true },
    { id: "e3-1", source: "sf-1", target: "f-1", type: "smoothstep", animated: true },
    { id: "e3-2", source: "sf-2", target: "f-1", type: "smoothstep", animated: true },
  ];
  
  // Re-ajustar vista después de actualizar nodos
  setTimeout(() => fitView({ padding: 0.2 }), 100);
});
</script>

<template>
  <div
    class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start"
    aria-label="Cuadro de torneo"
  >
    <!-- Columna izquierda: cuadro de torneo con Vue Flow -->
    <div class="card p-4 sm:p-6 space-y-4 h-[600px] flex flex-col">
      <div class="flex items-center justify-between gap-3 shrink-0">
        <div>
          <h3 class="text-lg font-semibold text-notion-text">
            Cuadro de torneo
          </h3>
          <p class="text-xs text-notion-muted">
            El sorteo asigna los equipos disponibles a los cruces de cuartos de
            final.
          </p>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-8 grow items-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        ></div>
      </div>

      <div
        v-else-if="error"
        class="p-4 mb-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 shrink-0"
      >
        {{ error }}
      </div>

      <div v-else class="grow w-full h-full border border-notion-border rounded-lg bg-notion-bg/30 relative">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :fit-view-on-init="true"
          :default-zoom="1"
          :min-zoom="0.5"
          :max-zoom="2"
        >
          <template #node-match="{ data }">
            <div class="bg-white border border-notion-border rounded-lg shadow-sm w-48 p-2 text-xs relative group hover:border-primary/50 transition-colors">
              <!-- Handle Input (Left) - Solo si no es root (Cuartos) -->
              <Handle 
                v-if="!data.isRoot"
                type="target" 
                :position="Position.Left" 
                class="!bg-notion-border !w-2 !h-2" 
              />
              
              <div class="text-[10px] text-notion-muted mb-1 font-medium uppercase tracking-wider text-center">
                {{ data.label }}
              </div>
              
              <div class="space-y-1">
                <!-- Team 1 -->
                <div class="flex items-center justify-between px-2 py-1 rounded bg-notion-bg/50 border border-transparent">
                  <div class="flex items-center gap-2 min-w-0">
                     <span
                      class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
                      :style="{ backgroundColor: data.teams && data.teams[0]?.color_principal || '#9ca3af' }"
                    >
                      {{ data.teams && data.teams[0]?.nombre?.charAt(0) || "-" }}
                    </span>
                    <span class="truncate font-medium text-notion-text">
                      {{ data.teams && data.teams[0]?.nombre || "TBD" }}
                    </span>
                  </div>
                </div>
                
                <!-- Team 2 -->
                <div class="flex items-center justify-between px-2 py-1 rounded bg-notion-bg/50 border border-transparent">
                   <div class="flex items-center gap-2 min-w-0">
                     <span
                      class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
                      :style="{ backgroundColor: data.teams && data.teams[1]?.color_principal || '#9ca3af' }"
                    >
                      {{ data.teams && data.teams[1]?.nombre?.charAt(0) || "-" }}
                    </span>
                    <span class="truncate font-medium text-notion-text">
                      {{ data.teams && data.teams[1]?.nombre || "TBD" }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Handle Output (Right) - Solo si no es leaf (Final) -->
              <Handle 
                v-if="!data.isLeaf"
                type="source" 
                :position="Position.Right" 
                class="!bg-notion-border !w-2 !h-2" 
              />
            </div>
          </template>
        </VueFlow>
      </div>
    </div>

    <!-- Columna derecha: listado y sorteo -->
    <div class="space-y-4">
      <div class="card p-4 sm:p-6 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-notion-text">
              Equipos participantes
            </h3>
            <p class="text-xs text-notion-muted">
              El sorteo asigna los equipos al cuadro de torneo.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="btn-primary text-xs"
            :disabled="loading || !!error || !teams.length"
            @click="shuffleTeams"
          >
            Sortear posiciones
          </button>
          <p class="text-[11px] text-notion-muted">
            {{ teams.length }} equipo{{ teams.length === 1 ? "" : "s" }}
            cargado{{ teams.length === 1 ? "" : "s" }}.
          </p>
        </div>

        <div v-if="loading" class="flex justify-center py-6">
          <div
            class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"
          ></div>
        </div>

        <div
          v-else-if="error"
          class="p-3 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700"
        >
          {{ error }}
        </div>

        <div
          v-else-if="!teams.length"
          class="py-4 text-xs text-notion-muted text-center"
        >
          No hay equipos disponibles para el torneo.
        </div>

        <div v-else class="space-y-2 max-h-80 overflow-y-auto">
          <div
            v-for="(team, index) in teams"
            :key="team.id"
            class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-notion-bg transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                :style="{ backgroundColor: team.color_principal || '#164bf0' }"
              >
                {{ team.nombre?.charAt(0) || "E" }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium text-notion-text truncate">
                  {{ team.nombre }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-[11px] text-notion-muted">
                #{{ index + 1 }}
              </span>
              <span
                v-if="bracketSlots.some((slot) => slot && slot.id === team.id)"
                class="badge badge-primary text-[10px]"
              >
                En cuadro
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.vue-flow__node-match {
  padding: 0;
  border: none;
  background: transparent;
  width: auto;
}
</style>
