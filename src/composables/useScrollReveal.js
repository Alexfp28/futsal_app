import { ref, onUnmounted } from 'vue'

/**
 * composable para animar elementos cuando entran en el viewport
 * usando IntersectionObserver
 */
export function useScrollReveal(options = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -60px 0px',
    once = true
  } = options

  const visibilityMap = ref(new Map())
  let observer = null

  const observe = (el, key) => {
    if (!el) return

    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const k = entry.target.dataset.revealKey
          if (entry.isIntersecting) {
            visibilityMap.value = new Map(visibilityMap.value.set(k, true))
            if (once) observer.unobserve(entry.target)
          }
        })
      }, { threshold, rootMargin })
    }

    el.dataset.revealKey = key
    observer.observe(el)
  }

  const isVisible = (key) => visibilityMap.value.get(key) ?? false

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return { observe, isVisible }
}
