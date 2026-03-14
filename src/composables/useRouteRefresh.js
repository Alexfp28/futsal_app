import { onMounted, onUnmounted } from "vue";

/**
 * Composable para recargar datos cuando cambia la ruta
 * Útil para páginas que necesitan refrescar datos al navegar hacia atrás
 *
 * @param {Function} refreshFn - Función que recarga los datos (ej: loadJugadores)
 *
 * @example
 * setup() {
 *   const loadData = async () => { ... };
 *   useRouteRefresh(loadData);
 * }
 */
export function useRouteRefresh(refreshFn) {
  const handleRouteChange = async () => {
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
