import { defineStore } from "pinia";
import { supabase, getUserProfile } from "@/lib/supabase";

// Constantes para persistencia local
const STORAGE_KEY_USER = "auth_user";
const STORAGE_KEY_PROFILE = "auth_profile";

// Timeouts para llamadas a Supabase (solo se aplican cuando no hay caché)
const SESSION_TIMEOUT_MS = 3000;
const PROFILE_TIMEOUT_MS = 3000;

// Promise compartida para inicialización — evita race conditions y polling
let _initPromise = null;

/**
 * Ejecuta una promesa con timeout. Si la promesa no se resuelve en `ms` milisegundos,
 * se rechaza con un error descriptivo.
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms),
    ),
  ]);
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.profile?.rol === "admin",
    isCapitan: (state) => state.profile?.rol === "capitan",
    isJugador: (state) => state.profile?.rol === "jugador",
    userRole: (state) => state.profile?.rol || null,
    userName: (state) => state.profile?.nombre || "Usuario",
    isLoadingAuth: (state) => state.loading && !state.initialized,
  },

  actions: {
    // ============================================
    // PERSISTENCIA LOCAL
    // ============================================

    persistAuth() {
      try {
        if (this.user) {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
        } else {
          localStorage.removeItem(STORAGE_KEY_USER);
        }
        if (this.profile) {
          localStorage.setItem(
            STORAGE_KEY_PROFILE,
            JSON.stringify(this.profile),
          );
        } else {
          localStorage.removeItem(STORAGE_KEY_PROFILE);
        }
      } catch (error) {
        console.error("[AUTH] Error al persistir estado:", error);
      }
    },

    hydrateFromStorage() {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY_USER);
        const storedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);

        if (storedUser) {
          this.user = JSON.parse(storedUser);
        }
        if (storedProfile) {
          this.profile = JSON.parse(storedProfile);
        }

        return !!storedUser;
      } catch (error) {
        console.error("[AUTH] Error al recuperar de localStorage:", error);
        this.clearStorage();
        return false;
      }
    },

    clearStorage() {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_PROFILE);
    },

    // ============================================
    // LISTENER DE AUTH
    // ============================================

    _authListenerSetup: false,

    setupAuthListener() {
      if (this._authListenerSetup) return;

      supabase.auth.onAuthStateChange(async (event, session) => {
        switch (event) {
          case "SIGNED_IN":
            if (session?.user) {
              this.user = session.user;
              try {
                this.profile = await withTimeout(
                  getUserProfile(session.user.id),
                  PROFILE_TIMEOUT_MS,
                  "getUserProfile (listener)",
                );
                this.persistAuth();
              } catch (error) {
                console.error("[AUTH] Error al obtener perfil:", error);
                this.error = "Error al cargar perfil de usuario";
              }
            }
            break;

          case "SIGNED_OUT":
            this.user = null;
            this.profile = null;
            this.initialized = false;
            this.clearStorage();
            break;

          case "TOKEN_REFRESHED":
            if (session?.user) {
              this.user = session.user;
              this.persistAuth();
            }
            break;

          case "USER_UPDATED":
            if (session?.user) {
              this.user = session.user;
              this.persistAuth();
            }
            break;
        }
      });

      this._authListenerSetup = true;
    },

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    async initialize() {
      // Ya inicializado con usuario — no hacer nada
      if (this.initialized && this.user) return;

      // Si ya hay una Promise de inicialización en curso, esperar la misma
      if (_initPromise) return _initPromise;

      // Crear la Promise antes de cualquier await — atómico, sin race condition
      _initPromise = this._doInitialize();
      return _initPromise;
    },

    async _doInitialize() {
      this.loading = true;

      try {
        // 1. Hydrate desde localStorage para UI inmediata
        const hasStoredAuth = this.hydrateFromStorage();

        // 2. Configurar listener de auth (idempotente)
        this.setupAuthListener();

        // 3. Si hay datos cacheados, inicializar de inmediato y verificar en background.
        //    Esto evita bloquear la navegación esperando respuesta de Supabase.
        if (hasStoredAuth && this.user) {
          this.initialized = true;
          this.loading = false;
          this._syncSessionInBackground(0);
          return;
        }

        // 4. Sin cache: verificar sesión con Supabase (usuario nuevo o sesión cerrada)
        let session = null;

        try {
          const sessionResult = await withTimeout(
            supabase.auth.getSession(),
            SESSION_TIMEOUT_MS,
            "getSession",
          );
          session = sessionResult.data?.session ?? null;

          if (sessionResult.error) {
            console.error(
              "[AUTH] Error al obtener sesión:",
              sessionResult.error,
            );
          }
        } catch (timeoutErr) {
          console.warn("[AUTH] getSession timeout:", timeoutErr.message);
          // Sin cache y sin respuesta: marcar como inicializado sin usuario
          this.initialized = true;
          return;
        }

        if (session?.user) {
          this.user = session.user;

          try {
            this.profile = await withTimeout(
              getUserProfile(session.user.id),
              PROFILE_TIMEOUT_MS,
              "getUserProfile",
            );
          } catch (profileError) {
            console.error("[AUTH] Error al obtener perfil:", profileError);
            this.error = "No se pudo cargar el perfil";
          }

          this.persistAuth();
        }

        this.initialized = true;
      } catch (error) {
        console.error("[AUTH] Error en inicialización:", error);
        this.error = error.message || "Error al inicializar autenticación";
        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },

    // ============================================
    // OAUTH
    // ============================================

    async signInWithGoogle() {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/intranet`,
          },
        });

        if (error) throw error;

        return { success: true };
      } catch (error) {
        console.error("[AUTH] Error en signInWithGoogle:", error);
        this.error = error.message;
        this.loading = false;
        return { success: false, error: error.message };
      }
    },

    // ============================================
    // LOGIN
    // ============================================

    async login(email, password) {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        this.user = data.user;

        // Cargar perfil con timeout
        this.profile = await withTimeout(
          getUserProfile(data.user.id),
          PROFILE_TIMEOUT_MS,
          "getUserProfile (login)",
        );

        this.initialized = true;
        _initPromise = Promise.resolve();
        this.persistAuth();

        return { success: true };
      } catch (error) {
        console.error("[AUTH] Error en login:", error);
        this.error = error.message;
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    // ============================================
    // REGISTER
    // ============================================

    async register(email, password, nombre, rol = "jugador") {
      this.loading = true;
      this.error = null;

      try {
        const validRoles = ["admin", "capitan", "jugador"];
        if (!validRoles.includes(rol)) {
          throw new Error(
            `Rol inválido: ${rol}. Roles válidos: ${validRoles.join(", ")}`,
          );
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre,
              rol,
            },
          },
        });

        if (error) throw error;

        if (!data.user) {
          if (data.session === null) {
            return {
              success: true,
              message:
                "Usuario creado. Por favor verifica tu correo electrónico para confirmar tu cuenta.",
            };
          }
        } else {
          // Verificar que el perfil se creó
          try {
            await withTimeout(
              supabase
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single(),
              PROFILE_TIMEOUT_MS,
              "verificar perfil (registro)",
            );
          } catch (e) {
            console.warn("[AUTH] No se pudo verificar el perfil:", e);
          }
        }

        return { success: true };
      } catch (error) {
        console.error("[AUTH] Error en register:", error);
        const errorMsg =
          error.message || error.error_description || "Error desconocido";
        this.error = errorMsg;
        return { success: false, error: errorMsg };
      } finally {
        this.loading = false;
      }
    },

    // ============================================
    // LOGOUT
    // ============================================

    async logout() {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("[AUTH] Error al cerrar sesión:", error);
      } finally {
        this.user = null;
        this.profile = null;
        this.initialized = false;
        this.clearStorage();
        _initPromise = null;
      }
    },

    // ============================================
    // UPDATE PROFILE
    // ============================================

    async updateProfile(updates) {
      if (!this.user) {
        return { success: false, error: "No autenticado" };
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", this.user.id);

        if (error) throw error;

        this.profile = { ...this.profile, ...updates };
        this.persistAuth();

        return { success: true };
      } catch (error) {
        console.error("[AUTH] Error al actualizar perfil:", error);
        return { success: false, error: error.message };
      }
    },

    // ============================================
    // VERIFICACIÓN DE SESIÓN
    // ============================================

    async verifySession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[AUTH] Error al verificar sesión:", error);
          return false;
        }

        if (!session) {
          if (this.user) {
            this.user = null;
            this.profile = null;
            this.initialized = false;
            this.clearStorage();
          }
          return false;
        }

        return true;
      } catch (error) {
        console.error("[AUTH] Error al verificar sesión:", error);
        return false;
      }
    },

    async _syncSessionInBackground(delay = 3000) {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          // Sesión inválida: limpiar estado (Vue reaccionará y el guard redirigirá)
          this.user = null;
          this.profile = null;
          this.clearStorage();
          return;
        }

        this.user = session.user;
        if (!this.profile || this.profile.id !== session.user.id) {
          try {
            this.profile = await withTimeout(
              getUserProfile(session.user.id),
              PROFILE_TIMEOUT_MS,
              "getUserProfile (background)",
            );
          } catch (e) {
            console.warn("[AUTH] Error al obtener perfil en background:", e);
          }
        }
        this.persistAuth();
      } catch (e) {
        console.warn("[AUTH] Error en sync background:", e.message);
      }
    },

    async refreshProfile() {
      if (!this.user) return;

      try {
        this.profile = await withTimeout(
          getUserProfile(this.user.id),
          PROFILE_TIMEOUT_MS,
          "getUserProfile (refresh)",
        );
        this.persistAuth();
      } catch (error) {
        console.error("[AUTH] Error al refrescar perfil:", error);
      }
    },
  },
});
