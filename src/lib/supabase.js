import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase - Reemplazar con tus credenciales
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://tu-proyecto.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "tu-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para obtener el perfil del usuario
export async function getUserProfile(userId) {
  // Obtener el perfil sin la relación de equipos
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  // Si tiene equipo_id, obtener la información del equipo
  if (profile.equipo_id) {
    const { data: equipo, error: equipoError } = await supabase
      .from("equipos")
      .select("*")
      .eq("id", profile.equipo_id)
      .single();

    if (!equipoError) {
      profile.equipos = [equipo];
    }
  }

  return profile;
}

// Helper para verificar el rol del usuario
export async function checkUserRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data?.rol;
}
