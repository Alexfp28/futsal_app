import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase - Reemplazar con tus credenciales
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://tu-proyecto.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "tu-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para obtener el perfil del usuario
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, equipos(*)")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
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
