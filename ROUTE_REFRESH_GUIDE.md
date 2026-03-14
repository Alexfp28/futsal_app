# Guía: Recargar datos al navegar entre rutas

## Problema Identificado

Cuando navegas hacia atrás en el navegador (back button), los componentes no recargaban datos correctamente. Esto ocurría porque:

1. El router no detectaba cambios de ruta del navegador
2. Los listeners de Supabase no se limpiaban
3. Los datos en `onMounted` no se volvían a ejecutar

## Solución Implementada

### 1. Hook de Router (`src/router/index.js`)

Se agregó un hook `afterEach` que dispara un evento personalizado cada vez que cambia la ruta:

```javascript
router.afterEach((to, from) => {
  window.dispatchEvent(new CustomEvent("route-change", { detail: { to, from } }));
});
```

### 2. Composable `useRouteRefresh` (`src/composables/useRouteRefresh.js`)

Este composable escucha el evento y ejecuta una función de recarga de datos:

```javascript
import { onMounted, onUnmounted } from "vue";

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

  return { handleRouteChange };
}
```

### 3. Uso en Componentes

**Patrón para páginas que cargan datos:**

```javascript
<script setup>
import { ref, onMounted } from "vue";
import { useRouteRefresh } from "@/composables/useRouteRefresh";
import { supabase } from "@/lib/supabase";

const datos = ref([]);
const loading = ref(true);

// Crear una función que cargue los datos
const loadDatos = async () => {
  loading.value = true;
  try {
    const { data } = await supabase.from("tabla").select("*");
    datos.value = data || [];
  } catch (e) {
    console.error("Error:", e);
  } finally {
    loading.value = false;
  }
};

// Ejecutar en montaje
onMounted(() => {
  loadDatos();
});

// Recargar cuando se navega a esta ruta
useRouteRefresh(loadDatos);
</script>
```

## ✅ Todas las Páginas Actualizadas

### Admin (4/4)
- ✅ AdminJugadores.vue
- ✅ AdminEquipos.vue
- ✅ AdminPartidos.vue
- ✅ AdminGastos.vue
- ✅ AdminDashboard.vue

### Capitán (2/2)
- ✅ CapitanEquipo.vue
- ✅ CapitanDashboard.vue

### Jugador (1/1)
- ✅ JugadorPerfil.vue

### Públicas (9/9)
- ✅ CalendarioPage.vue
- ✅ EquiposPage.vue
- ✅ SugerenciasPage.vue
- ✅ TraspasosPage.vue
- ✅ PalmaresPage.vue
- ✅ InvitacionesPage.vue
- ✅ JugadoresLibresPage.vue
- ✅ EconomiaPage.vue
- ✅ IdentidadPage.vue
- ℹ️ RankingsPage.vue - No necesita actualización (no tiene onMounted)

### Intranet (Especial)
- ℹ️ IntranetPage.vue - No necesita actualización (no carga datos, solo componentes)

## Cómo Aplicar a Otras Páginas

1. **Importar el composable:**
   ```javascript
   import { useRouteRefresh } from "@/composables/useRouteRefresh";
   ```

2. **Extraer la lógica de carga a una función:**
   ```javascript
   const loadData = async () => {
     loading.value = true;
     // ... código que carga datos
     loading.value = false;
   };
   ```

3. **Usar en onMounted:**
   ```javascript
   onMounted(() => {
     loadData();
   });
   ```

4. **Agregar el composable:**
   ```javascript
   useRouteRefresh(loadData);
   ```

## Resultado

Ahora cuando el usuario:
- 👈 Usa el botón back del navegador
- 🔄 Navega entre rutas
- 🔁 Vuelve a la misma ruta

Los datos se recargarán automáticamente y el componente mostrará la información actualizada correctamente.

## Logs para Debug

El composable imprime logs con el prefijo `[RouteRefresh]` en la consola del navegador:
```
[RouteRefresh] Cambio de ruta detectado, reloading data
```

Puedes usar esto para verificar que el mecanismo está funcionando.
