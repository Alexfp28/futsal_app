import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("chart.js") || id.includes("vue-chartjs")) {
            return "charts";
          }

          if (id.includes("@vue-flow/core")) {
            return "vue-flow";
          }

          if (id.includes("@supabase")) {
            return "supabase";
          }

          if (id.includes("vue-router") || id.includes("pinia")) {
            return "router-store";
          }

          if (id.includes("@heroicons") || id.includes("@headlessui")) {
            return "ui";
          }

          return "vendor";
        },
      },
    },
  },
});
