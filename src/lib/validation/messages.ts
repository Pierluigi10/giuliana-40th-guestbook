/**
 * Centralized Italian error messages for Zod validation
 * Single source of truth for all validation error messages
 */

export const ERROR_MESSAGES = {
  common: {
    invalidId: 'ID non valido',
    required: 'Campo obbligatorio',
    serverError: 'Errore del server',
  },
  text: {
    tooShort: 'Il messaggio deve essere di almeno 10 caratteri',
    tooLong: 'Il messaggio non può superare i 1000 caratteri',
    required: 'Il messaggio è obbligatorio',
  },
  media: {
    invalidUrl: 'URL del file non valido',
    notSupabaseUrl: 'URL non valido: deve provenire da Supabase Storage',
    image: {
      tooLarge: 'File troppo grande (max 10MB)',
      invalidType: 'Tipo di file non supportato. Usa: JPEG, PNG, GIF, WEBP',
    },
    video: {
      tooLarge: 'File troppo grande (max 15MB)',
      invalidType: 'Tipo di file non supportato. Usa: MP4, MOV, WEBM',
    },
  },
  auth: {
    invalidEmail: 'Email non valida',
    passwordTooShort: 'La password deve contenere almeno 6 caratteri',
    passwordRequired: 'Password obbligatoria',
    fullNameTooShort: 'Inserisci nome e cognome validi',
    passwordMismatch: 'Le password non coincidono',
    invalidRegistration: 'Registrazione non valida',
  },
  admin: {
    invalidContentId: 'ID contenuto non valido',
    noContentSelected: 'Nessun contenuto selezionato',
    tooManyContentSelected: 'Troppi contenuti selezionati (max 50)',
  },
  reactions: {
    invalidEmoji: 'Emoji non valida',
    singleEmojiOnly: 'Usa una sola emoji',
  },
} as const
