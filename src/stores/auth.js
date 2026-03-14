import { defineStore } from "pinia";
import { supabase, getUserProfile } from "@/lib/supabase";

// Constantes para persistencia local
const STORAGE_KEY_USER = "auth_user";
const STORAGE_KEY_PROFILE = "auth_profile";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
    loading: false,
    error: null,
    initialized: false,
    initializing: false, // Nuevo flag para evitar múltiples inicializaciones
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.profile?.rol === "admin",
    isCapitan: (state) => state.profile?.rol === "capitan",
    isJugador: (state) => state.profile?.rol === "jugador",
    userRole: (state) => state.profile?.rol || null,
    userName: (state) => state.profile?.nombre || "Usuario",
    // Nuevo getter para verificar si está cargando la autenticación
    isLoadingAuth: (state) => state.loading && !state.initialized,
  },

  actions: {
    // ============================================
    // MÉTODOS DE PERSISTENCIA LOCAL
    // ============================================

    /**
     * Guardar estado de autenticación en localStorage para recuperación rápida
     * Esto proporciona una capa de respaldo antes de que Supabase cargue
     */
    persistAuth() {
      try {
        if (this.user) {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
          console.log("[AUTH] ✓ Usuario persistido en localStorage");
        } else {
          localStorage.removeItem(STORAGE_KEY_USER);
          console.log("[AUTH] ✓ Usuario eliminado de localStorage");
        }

        if (this.profile) {
          localStorage.setItem(
            STORAGE_KEY_PROFILE,
            JSON.stringify(this.profile),
          );
          console.log("[AUTH] ✓ Perfil persistido en localStorage");
        } else {
          localStorage.removeItem(STORAGE_KEY_PROFILE);
          console.log("[AUTH] ✓ Perfil eliminado de localStorage");
        }
      } catch (error) {
        console.error("[AUTH] Error al persistir estado:", error);
      }
    },

    /**
     * Recuperar estado de autenticación desde localStorage
     * Útil para mostrarUI inmediata mientras Supabase carga
     */
    hydrateFromStorage() {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY_USER);
        const storedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);

        if (storedUser) {
          const user = JSON.parse(storedUser);
          this.user = user;
          console.log(
            "[AUTH] ✓ Usuario restaurado desde localStorage:",
            user.id,
          );
        }

        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          this.profile = profile;
          console.log(
            "[AUTH] ✓ Perfil restaurado desde localStorage:",
            profile.rol,
          );
        }

        return !!storedUser;
      } catch (error) {
        console.error("[AUTH] Error al recuperar de localStorage:", error);
        this.clearStorage();
        return false;
      }
    },

    /**
     * Limpiar datos de persistencia local
     */
    clearStorage() {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_PROFILE);
      console.log("[AUTH] ✓ Datos de localStorage eliminados");
    },

    // ============================================
    // CONFIGURACIÓN DEL LISTENER DE AUTH
    // ============================================

    // Flag para evitar múltiples suscripciones al listener
    _authListenerSetup: false,

    /**
     * Configurar listener de cambios de auth (solo una vez)
     */
    setupAuthListener() {
      if (this._authListenerSetup) {
        console.log("[AUTH] Listener de auth ya configurado, omitiendo...");
        return;
      }

      console.log("[AUTH] 🔄 Configurando listener de onAuthStateChange...");

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(
          "[AUTH] 📡 Evento de auth recibido:",
          event,
          session ? session.user.id : "sin sesión",
        );

        switch (event) {
          case "SIGNED_IN":
            if (session?.user) {
              console.log("[AUTH] → Usuario autenticado, cargando perfil...");
              this.user = session.user;
              try {
                this.profile = await getUserProfile(session.user.id);
                console.log("[AUTH] ✓ Perfil cargado correctamente");
                this.persistAuth();
              } catch (error) {
                console.error("[AUTH] Error al obtener perfil:", error);
                this.error = "Error al cargar perfil de usuario";
              }
            }
            break;

          case "SIGNED_OUT":
            console.log("[AUTH] → Sesión cerrada, limpiando estado...");
            this.user = null;
            this.profile = null;
            this.initialized = false;
            this.clearStorage();
            break;

          case "TOKEN_REFRESHED":
            console.log("[AUTH] → Token refrescado, sesión válida");
            if (session?.user) {
              this.user = session.user;
              this.persistAuth();
            }
            break;

          case "USER_UPDATED":
            console.log("[AUTH] → Usuario actualizado");
            if (session?.user) {
              this.user = session.user;
              this.persistAuth();
            }
            break;

          default:
            console.log("[AUTH] 📡 Evento no manejado:", event);
        }
      });

      this._authListenerSetup = true;
      console.log("[AUTH] ✓ Listener configurado correctamente");
    },

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    async initialize() {
      console.log("[AUTH] 🚀 Iniciando proceso de inicialización...");
      console.log(
        "[AUTH] Estado actual - initialized:",
        this.initialized,
        "loading:",
        this.loading,
      );

      // Si ya se inicializó completamente, no hacer nada
      if (this.initialized && this.user) {
        console.log("[AUTH] ✓ Ya inicializado con usuario, retornando...");
        return;
      }

      // Si ya está inicializando, esperar a que termine
      if (this.initializing) {
        console.log("[AUTH] ⏳ Inicialización en progreso, esperando...");
        while (this.initializing) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        console.log("[AUTH] ✓ Espera de inicialización completada");
        return;
      }

      // Marcar como inicializando ANTES de empezar
      this.initializing = true;
      this.loading = true;

      try {
        // 1. Primero: Intentar hydrate desde localStorage para UI inmediata
        const hasStoredAuth = this.hydrateFromStorage();
        console.log(
          "[AUTH] Hydrate desde localStorage:",
          hasStoredAuth ? "exitoso" : "sin datos",
        );

        // 2. Segundo: Configurar listener de auth
        this.setupAuthListener();

        // 3. Tercero: Verificar sesión con Supabase
        console.log("[AUTH] 🔍 Verificando sesión con Supabase...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[AUTH] ❌ Error al obtener sesión:", sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log(
            "[AUTH] ✓ Sesión activa encontrada para:",
            session.user.id,
          );

          // Verificar si el usuario cambió (por si acaso)
          if (this.user?.id !== session.user.id) {
            console.log(
              "[AUTH] → Usuario diferente al almacenado, actualizando...",
            );
            this.user = session.user;
          }

          // Cargar perfil si no existe o si es diferente
          if (!this.profile || this.profile.id !== session.user.id) {
            console.log("[AUTH] 🔄 Cargando perfil del usuario...");
            try {
              this.profile = await getUserProfile(session.user.id);
              console.log("[AUTH] ✓ Perfil cargado:", this.profile.rol);
            } catch (profileError) {
              console.error("[AUTH] ❌ Error al obtener perfil:", profileError);
              // No lanzamos el error para permitir que la app funcione sin perfil
              this.error = "No se pudo cargar el perfil";
            }
          }

          // Persistir estado actualizado
          this.persistAuth();
        } else {
          console.log("[AUTH] ℹ️ No hay sesión activa en Supabase");

          // Si tenemos datos en localStorage pero no hay sesión en Supabase,
          //可能是会话过期，需要清理
          if (hasStoredAuth) {
            console.log(
              "[AUTH] ⚠️ Sesión de Supabase expirada, limpiando datos locales...",
            );
            this.user = null;
            this.profile = null;
            this.clearStorage();
          }
        }

        // 4. Cuarto: Marcar como inicializado DESPUÉS de todo
        this.initialized = true;
        console.log("[AUTH] ✓ Inicialización completada exitosamente");
      } catch (error) {
        console.error("[AUTH] ❌ Error en initialize:", error);
        this.error = error.message || "Error al inicializar autenticación";

        // Mantenemos initialized = false para permitir reintento
        // Pero usamos datos de localStorage si están disponibles
        if (this.user) {
          console.log(
            "[AUTH] ⚠️ Error en Supabase pero tenemos datos locales, manteniendo sesión",
          );
          this.initialized = true;
        }
      } finally {
        this.loading = false;
        this.initializing = false;
        console.log(
          "[AUTH] Estado final - initialized:",
          this.initialized,
          "user:",
          this.user?.id,
        );
      }
    },

    // ============================================
    // OAUTH (GOOGLE, ETC)
    // ============================================

    async signInWithGoogle() {
      console.log("[AUTH] 🔐 Iniciando login con Google...");
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/intranet`,
          },
        });

        if (error) {
          console.error("[AUTH] ❌ Error en signInWithOAuth:", error);
          throw error;
        }

        console.log("[AUTH] ✓ OAuth iniciado correctamente");
        return { success: true };
      } catch (error) {
        console.error("[AUTH] ❌ Error en signInWithGoogle:", error);
        this.error = error.message;
        this.loading = false;
        return { success: false, error: error.message };
      }
    },

    // ============================================
    // LOGIN
    // ============================================

    async login(email, password) {
      console.log("[AUTH] 🔐 Iniciando login para:", email);
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("[AUTH] ❌ Error en signInWithPassword:", error);
          throw error;
        }

        console.log("[AUTH] ✓ Login exitoso, usuario:", data.user.id);

        this.user = data.user;

        // Cargar perfil
        console.log("[AUTH] 🔄 Cargando perfil después de login...");
        this.profile = await getUserProfile(data.user.id);
        console.log(
          "[AUTH] ✓ Perfil cargado después de login:",
          this.profile.rol,
        );

        this.initialized = true;

        // Persistir estado
        this.persistAuth();

        return { success: true };
      } catch (error) {
        console.error("[AUTH] ❌ Error en login:", error);
        this.error = error.message;
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
        console.log("[AUTH] Login completado, loading:", this.loading);
      }
    },

    // ============================================
    // REGISTER
    // ============================================

    async register(email, password, nombre, rol = "jugador") {
      console.log("[AUTH] 📝 Iniciando registro con:", { email, nombre, rol });
      this.loading = true;
      this.error = null;

      try {
        // Verificar que el rol sea válido
        const validRoles = ["admin", "capitan", "jugador"];
        if (!validRoles.includes(rol)) {
          throw new Error(
            `Rol inválido: ${rol}. Roles válidos: ${validRoles.join(", ")}`,
          );
        }

        // Registrar con metadatos para que el trigger cree el perfil automáticamente
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

        console.log("[AUTH] Respuesta de signUp:", { data, error });

        if (error) {
          console.error("[AUTH] Error en signUp:", error);
          throw error;
        }

        // Verificar si el usuario fue creado
        if (!data.user) {
          console.warn(
            "[AUTH] Usuario no fue creado, verificando session:",
            data,
          );
          // Puede ser que el usuario ya existe o el email confirmation está habilitado
          if (data.session === null) {
            // El usuario fue creado pero requiere confirmación de email
            return {
              success: true,
              message:
                "Usuario creado. Por favor verifica tu correo electrónico para confirmar tu cuenta.",
            };
          }
        } else {
          console.log("[AUTH] ✓ Usuario creado con ID:", data.user.id);
          // Verificar que el perfil se creó
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();

            if (profileError) {
              console.error("[AUTH] Error al verificar perfil:", profileError);
            } else {
              console.log("[AUTH] ✓ Perfil verificado:", profile);
            }
          } catch (e) {
            console.warn("[AUTH] No se pudo verificar el perfil:", e);
          }
        }

        return { success: true };
      } catch (error) {
        console.error("[AUTH] Error completo en register:", error);
        // Proporcionar mensaje más detallado
        const errorMsg =
          error.message || error.error_description || "Error desconocido";
        this.error = errorMsg;
        return { success: false, error: errorMsg };
      } finally {
        this.loading = false;
        console.log("[AUTH] Registro completado, loading:", this.loading);
      }
    },

    // ============================================
    // LOGOUT
    // ============================================

    async logout() {
      console.log("[AUTH] 🚪 Iniciando logout...");
      try {
        await supabase.auth.signOut();
        console.log("[AUTH] ✓ SignOut completado en Supabase");

        this.user = null;
        this.profile = null;
        this.initialized = false;
        this.clearStorage();

        console.log("[AUTH] ✓ Estado limpiado después de logout");
      } catch (error) {
        console.error("[AUTH] ❌ Error al cerrar sesión:", error);
        // En caso de error, limpiar igualmente el estado local
        this.user = null;
        this.profile = null;
        this.initialized = false;
        this.clearStorage();
      }
    },

    // ============================================
    // UPDATE PROFILE
    // ============================================

    async updateProfile(updates) {
      if (!this.user) {
        console.warn(
          "[AUTH] Intentando actualizar perfil sin usuario autenticado",
        );
        return { success: false, error: "No autenticado" };
      }

      console.log("[AUTH] 🔄 Actualizando perfil:", updates);

      try {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", this.user.id);

        if (error) throw error;

        // Actualizar el estado local
        this.profile = { ...this.profile, ...updates };

        // Persistir cambio
        this.persistAuth();

        console.log("[AUTH] ✓ Perfil actualizado correctamente");
        return { success: true };
      } catch (error) {
        console.error("[AUTH] ❌ Error al actualizar perfil:", error);
        return { success: false, error: error.message };
      }
    },

    // ============================================
    // MÉTODO DE VERIFICACIÓN DE SESIÓN
    // ============================================

    /**
     * Verificar manualmente la validez de la sesión actual
     * Útil para verificar antes de acciones importantes
     */
    async verifySession() {
      console.log("[AUTH] 🔍 Verificando validez de sesión...");

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[AUTH] ❌ Error al verificar sesión:", error);
          return false;
        }

        if (!session) {
          console.log("[AUTH] ℹ️ Sesión no válida o expirada");
          // Limpiar estado si la sesión ya no es válida
          if (this.user) {
            console.log("[AUTH] ⚠️ Limpiando datos de usuario local");
            this.user = null;
            this.profile = null;
            this.initialized = false;
            this.clearStorage();
          }
          return false;
        }

        console.log("[AUTH] ✓ Sesión válida para:", session.user.id);
        return true;
      } catch (error) {
        console.error("[AUTH] ❌ Excepción al verificar sesión:", error);
        return false;
      }
    },

    /**
     * Forzar recarga del perfil desde la base de datos
     */
    async refreshProfile() {
      if (!this.user) {
        console.warn("[AUTH] No hay usuario para refrescar perfil");
        return;
      }

      console.log("[AUTH] 🔄 Refrescando perfil desde base de datos...");

      try {
        this.profile = await getUserProfile(this.user.id);
        this.persistAuth();
        console.log("[AUTH] ✓ Perfil refrescado:", this.profile.rol);
      } catch (error) {
        console.error("[AUTH] ❌ Error al refrescar perfil:", error);
      }
    },
  },
});
