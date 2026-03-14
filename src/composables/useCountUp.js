import { ref, watch, onUnmounted } from 'vue'

/**
 * Composable para animar números con conteo suave
 * @param {Ref} targetValue - valor target a alcanzar (puede ser un computed)
 * @param {Object} options - duración, delay, easing
 * @returns {Object} { displayValue } - ref del número animado
 */
export function useCountUp(targetValue, options = {}) {
  const {
    duration = 1800,
    startDelay = 0
  } = options

  const displayValue = ref(0)
  let animFrame = null

  /**
   * easeOutCubic: función de easing suave
   */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

  const start = (target) => {
    if (animFrame) cancelAnimationFrame(animFrame)

    const startTime = performance.now() + startDelay
    const startVal = displayValue.value

    const tick = (now) => {
      if (now < startTime) {
        animFrame = requestAnimationFrame(tick)
        return
      }

      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)

      displayValue.value = Math.round(startVal + (target - startVal) * eased)

      if (progress < 1) {
        animFrame = requestAnimationFrame(tick)
      }
    }

    animFrame = requestAnimationFrame(tick)
  }

  watch(
    targetValue,
    (newVal) => {
      if (newVal && newVal > 0) {
        start(newVal)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (animFrame) {
      cancelAnimationFrame(animFrame)
    }
  })

  return { displayValue }
}
