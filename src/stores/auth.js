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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Crear el perfil del usuario
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              nombre,
              rol,
              libre: rol === "jugador",
            });

          if (profileError) throw profileError;
        }

        return { success: true };
      } catch (error) {
        this.error = error.message;
        return { success: false, error: error.message };
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
