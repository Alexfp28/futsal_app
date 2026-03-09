<script setup>
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";
import { STRING } from "@/constants/STRING";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: STRING.BUTTONS.CONFIRM,
  },
  cancelText: {
    type: String,
    default: STRING.BUTTONS.CANCEL,
  },
  type: {
    type: String,
    default: "warning", // 'warning' | 'info' | 'danger'
    validator: (value) => ["warning", "info", "danger"].includes(value),
  },
  showCancelButton: {
    type: Boolean,
    default: true,
  },
  showConfirmButton: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["confirm", "cancel", "close"]);

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("cancel");
};

const handleClose = () => {
  emit("close");
};

// Cerrar con ESC
const handleKeydown = (event) => {
  if (event.key === "Escape" && props.show) {
    handleClose();
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @keydown="handleKeydown"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleClose"
        ></div>

        <!-- Dialog -->
        <div
          class="relative w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title"
        >
          <!-- Header -->
          <div class="flex items-start justify-between p-6 pb-0">
            <div class="flex items-center gap-3">
              <!-- Icono según tipo -->
              <div
                v-if="type === 'warning'"
                class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"
              >
                <ExclamationTriangleIcon
                  class="w-6 h-6 text-amber-600"
                  aria-hidden="true"
                />
              </div>
              <div
                v-else-if="type === 'danger'"
                class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
              >
                <ExclamationTriangleIcon
                  class="w-6 h-6 text-red-600"
                  aria-hidden="true"
                />
              </div>
              <div
                v-else
                class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
              >
                <InformationCircleIcon
                  class="w-6 h-6 text-blue-600"
                  aria-hidden="true"
                />
              </div>

              <!-- Título -->
              <h3 class="text-lg font-semibold text-gray-900" :id="title">
                {{ title }}
              </h3>
            </div>

            <!-- Botón cerrar -->
            <button
              type="button"
              class="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              @click="handleClose"
              :aria-label="STRING.BUTTONS.CLOSE"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Contenido -->
          <div class="p-6">
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ message }}
            </p>
          </div>

          <!-- Footer con botones -->
          <div class="flex justify-end gap-3 px-6 pb-6">
            <button
              v-if="showCancelButton"
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition-colors"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              v-if="showConfirmButton"
              type="button"
              class="px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              :class="{
                'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500':
                  type === 'warning',
                'bg-red-600 hover:bg-red-700 focus:ring-red-500':
                  type === 'danger',
                'bg-primary hover:bg-primary/90 focus:ring-primary/50':
                  type === 'info',
              }"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
