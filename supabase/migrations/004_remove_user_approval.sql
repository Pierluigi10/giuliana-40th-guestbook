-- ============================================================================
-- Migration 004: Rimozione Sistema di Approvazione Utenti
-- ============================================================================
-- Data: 2026-01-23
-- Descrizione: Sostituisce l'approvazione manuale admin con conferma email
--              Supabase nativa. Gli utenti confermano email e accedono
--              direttamente. Admin approva solo i contenuti.
-- ============================================================================

-- ============================================================================
-- PARTE 1: Approva Automaticamente Utenti Esistenti
-- ============================================================================
-- Garantisce backward compatibility: tutti i guest esistenti possono
-- continuare a usare l'app senza interruzioni.

UPDATE public.profiles
SET is_approved = true
WHERE role = 'guest' AND is_approved = false;

-- Log del risultato
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Approvati automaticamente % utenti guest esistenti', updated_count;
END $$;

-- ============================================================================
-- PARTE 2: Modifica Trigger per Nuovi Utenti
-- ============================================================================
-- I nuovi utenti avranno is_approved = TRUE di default.
-- La conferma email è gestita da Supabase Auth, non dal campo is_approved.

-- Drop trigger e funzione esistenti
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ricrea funzione con is_approved = TRUE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'guest',
    TRUE  -- ✨ Cambiato da FALSE a TRUE
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Errore creazione profilo per utente %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ricrea trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PARTE 3: Aggiorna Metadati Colonna
-- ============================================================================
-- Documenta che is_approved è ora sempre TRUE e deprecato per approvazione manuale.

COMMENT ON COLUMN public.profiles.is_approved IS
  'Sempre TRUE per nuovi utenti. Sistema di approvazione manuale rimosso il 2026-01-23. '
  'La conferma utente è gestita tramite email verification di Supabase Auth. '
  'Campo mantenuto per backward compatibility e RLS policies esistenti.';

-- ============================================================================
-- PARTE 4: Verifica Risultati
-- ============================================================================
-- Query di verifica (da eseguire manualmente dopo la migration)

-- Verifica 1: Tutti i guest devono avere is_approved = true
-- SELECT role, is_approved, COUNT(*)
-- FROM public.profiles
-- GROUP BY role, is_approved;

-- Verifica 2: Il trigger funziona correttamente
-- SELECT id, email, full_name, role, is_approved
-- FROM public.profiles
-- ORDER BY created_at DESC
-- LIMIT 5;

-- Verifica 3: Le RLS policies sono ancora attive
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'content', 'reactions');

-- ============================================================================
-- NOTE IMPORTANTI
-- ============================================================================
-- ⚠️  RLS POLICIES NON MODIFICATE
--     Le policy esistenti che controllano is_approved = true rimangono intatte.
--     Questo garantisce che il sistema continui a funzionare correttamente.
--
-- ✅  BACKWARD COMPATIBLE
--     Utenti registrati prima della migration continuano a funzionare.
--
-- 🔒  SICUREZZA MANTENUTA
--     Email confirmation gestita da Supabase Auth (più sicuro dell'approvazione manuale).
--
-- 📧  CONFIGURAZIONE RICHIESTA
--     Abilitare email confirmation in Supabase Dashboard:
--     - Authentication → Settings → Email confirmation: ENABLED
--     - Authentication → URL Configuration → Redirect URLs: /auth/callback
-- ============================================================================
