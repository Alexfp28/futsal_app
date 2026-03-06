/**
 * Constantes de texto comunes para la aplicación
 * Sistema centralizado para evitar magic strings
 */
export const STRING = {
  // ==================== BOTONES ====================
  BUTTONS: {
    CONFIRM: "Confirmar",
    CANCEL: "Cancelar",
    ACCEPT: "Aceptar",
    CLOSE: "Cerrar",
    YES: "Sí",
    NO: "No",
  },

  // ==================== TÍTULOS DE DIÁLOGOS ====================
  DIALOGS: {
    CONFIRM_EXPULSION: "Expulsar Jugador",
    CONFIRM_RECHAZO: "Rechazar Solicitud",
    PETICION_ENVIADA: "Petición Enviada",
    ERROR: "Error",
    CAPITAN_NO_EXPULSABLE: "Acción No Permitida",
  },

  // ==================== MENSAJES DE EQUIPO ====================
  EQUIPO: {
    EXPULSION_JUGADOR: (nombre) =>
      `¿Estás seguro de expulsar a ${nombre} del equipo?`,
    NO_EXPULSAR_CAPITAN: "No puedes expulsar al capitán del equipo.",
    RECHAZAR_SOLICITUD: (nombre) => `¿Rechazar la solicitud de ${nombre}?`,
    PETICION_ENVIADA: (nombre) =>
      `Petición enviada a ${nombre}. El jugador deberá aceptar la invitación para unirse al equipo.`,
  },

  // ==================== MENSAJES DE ERROR ====================
  ERRORS: {
    CARGAR_EQUIPO: "Error al cargar el equipo",
    CARGAR_PLANTILLA: "Error al cargar la plantilla",
    ENVIAR_PETICION: "Error al enviar la petición",
    ACEPTAR_SOLICITUD: "Error al aceptar la solicitud",
    RECHAZAR_SOLICITUD: "Error al rechazar la solicitud",
    CAMBIAR_ESTADO: "Error al cambiar el estado",
    EXPULSAR_JUGADOR: "Error al expulsar al jugador",
    SUBIR_IMAGEN: "Error al subir la imagen. Por favor, inténtalo de nuevo.",
  },

  // ==================== MENSAJES DE VALIDACIÓN ====================
  VALIDATION: {
    IMAGEN_INVALIDA: "Por favor selecciona un archivo de imagen válido",
    IMAGEN_MUY_GRANDE: "La imagen no puede superar los 2MB",
  },
};

export default STRING;
