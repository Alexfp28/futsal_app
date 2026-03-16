import { onMounted, onUnmounted } from "vue";

/**
 * Composable para recargar datos cuando el usuario navega DE VUELTA a esta página.
 * Útil cuando el componente ya cargó datos en onMounted y quieres refrescarlos
 * al regresar desde otra ruta.
 *
 * IMPORTANTE: El primer evento route-change tras montar se ignora para evitar
 * doble carga (onMounted ya llama a loadData al montar).
 *
 * @param {Function} refreshFn - Función que recarga los datos (ej: loadJugadores)
 *
 * @example
 * setup() {
 *   const loadData = async () => { ... };
 *   onMounted(loadData);
 *   useRouteRefresh(loadData); // recarga al volver desde otra ruta
 * }
 */
export function useRouteRefresh(refreshFn) {
  // Ignorar el primer evento (el de la navegación inicial hacia este componente)
  let ignoreFirst = true;

  const handleRouteChange = async () => {
    if (ignoreFirst) {
      ignoreFirst = false;
      console.log(`[RouteRefresh] Primer evento ignorado (navegación inicial)`);
      return;
    }
    console.log(`[RouteRefresh] Cambio de ruta detectado, reloading data`);
    try {
      await refreshFn();
    } catch (error) {
      console.error("[RouteRefresh] Error reloading data:", error);
    }
  };

  onMounted(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("route-change", handleRouteChange);
    }
  });

  onUnmounted(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("route-change", handleRouteChange);
    }
  });

  return {
    handleRouteChange,
  };
}
