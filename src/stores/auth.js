import { defineStore } from "pinia";
import { supabase, getUserProfile } from "@/lib/supabase";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.profile?.rol === "admin",
    isCapitan: (state) => state.profile?.rol === "capitan",
    isJugador: (state) => state.profile?.rol === "jugador",
    userRole: (state) => state.profile?.rol || null,
    userName: (state) => state.profile?.nombre || "Usuario",
  },

  actions: {
    async initialize() {
      this.loading = true;

      // Verificar si hay una sesión activa
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        this.user = session.user;
        try {
          this.profile = await getUserProfile(session.user.id);
        } catch (error) {
          console.error("Error al obtener perfil:", error);
        }
      }

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          this.user = session.user;
          try {
            this.profile = await getUserProfile(session.user.id);
          } catch (error) {
            console.error("Error al obtener perfil:", error);
          }
        } else if (event === "SIGNED_OUT") {
          this.user = null;
          this.profile = null;
        }
      });

      this.loading = false;
    },

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
        this.profile = await getUserProfile(data.user.id);

        return { success: true };
      } catch (error) {
        this.error = error.message;
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    async register(email, password, nombre, rol = "jugador") {
      this.loading = true;
      this.error = null;

      try {
        console.log("Iniciando registro con:", { email, nombre, rol });

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

        console.log("Respuesta de signUp:", { data, error });

        if (error) {
          console.error("Error en signUp:", error);
          throw error;
        }

        // Verificar si el usuario fue creado
        if (!data.user) {
          console.warn("Usuario no fue creado, verificando session:", data);
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
          console.log("Usuario creado con ID:", data.user.id);
          // Verificar que el perfil se creó
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();

            if (profileError) {
              console.error("Error al verificar perfil:", profileError);
            } else {
              console.log("Perfil verificado:", profile);
            }
          } catch (e) {
            console.warn("No se pudo verificar el perfil:", e);
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error completo en register:", error);
        // Proporcionar mensaje más detallado
        const errorMsg =
          error.message || error.error_description || "Error desconocido";
        this.error = errorMsg;
        return { success: false, error: errorMsg };
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await supabase.auth.signOut();
        this.user = null;
        this.profile = null;
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    },

    async updateProfile(updates) {
      if (!this.user) return { success: false, error: "No autenticado" };

      try {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", this.user.id);

        if (error) throw error;

        // Actualizar el estado local
        this.profile = { ...this.profile, ...updates };

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },
});
