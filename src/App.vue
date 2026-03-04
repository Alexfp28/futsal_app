<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import Navbar from "@/components/layout/Navbar.vue";
import Footer from "@/components/layout/Footer.vue";

const authStore = useAuthStore();

onMounted(() => {
  authStore.initialize();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-notion-bg">
    <Navbar />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <Footer />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
