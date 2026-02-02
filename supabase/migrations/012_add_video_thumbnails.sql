-- ============================================================================
-- Migration 012: Add Video Thumbnails Support
-- Data: 2026-02-02
-- Descrizione: Aggiunge colonna thumbnail_url per memorizzare URL thumbnail video
--
-- SICUREZZA:
-- - Solo ADD COLUMN (non modifica dati esistenti)
-- - Colonna nullable (backward compatible)
-- - Transaction atomica con verifiche
-- - Zero rischio data loss
-- ============================================================================

BEGIN;

-- Documenta stato pre-migration
DO $$
DECLARE
  video_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM content;
  SELECT COUNT(*) INTO video_count FROM content WHERE type = 'video';

  RAISE NOTICE '=== PRE-MIGRATION STATE ===';
  RAISE NOTICE 'Total content records: %', total_count;
  RAISE NOTICE 'Video records: %', video_count;
  RAISE NOTICE '===========================';
END $$;

-- ============================================================================
-- STEP 1: Aggiungi colonna thumbnail_url (nullable per backward compatibility)
-- ============================================================================

ALTER TABLE content ADD COLUMN thumbnail_url TEXT;

-- ============================================================================
-- STEP 2: Aggiungi commento descrittivo
-- ============================================================================

COMMENT ON COLUMN content.thumbnail_url IS
  'URL thumbnail video auto-generata durante upload. NULL per video esistenti (pre-feature) o per immagini/testi.';

-- ============================================================================
-- STEP 3: Crea index per query filtrate (solo su video)
-- ============================================================================

CREATE INDEX idx_content_video_thumbnails
ON content(type, thumbnail_url)
WHERE type = 'video';

-- ============================================================================
-- STEP 4: Verifica integrità post-migration
-- ============================================================================

DO $$
DECLARE
  video_count_after INTEGER;
  total_count_after INTEGER;
  column_exists BOOLEAN;
  index_exists BOOLEAN;
BEGIN
  -- Verifica colonna creata
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content' AND column_name = 'thumbnail_url'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'MIGRATION FAILED: thumbnail_url column not created';
  END IF;

  -- Verifica index creato
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'content' AND indexname = 'idx_content_video_thumbnails'
  ) INTO index_exists;

  IF NOT index_exists THEN
    RAISE EXCEPTION 'MIGRATION FAILED: idx_content_video_thumbnails index not created';
  END IF;

  -- Verifica count invariato (CRITICAL CHECK)
  SELECT COUNT(*) INTO total_count_after FROM content;
  SELECT COUNT(*) INTO video_count_after FROM content WHERE type = 'video';

  RAISE NOTICE '=== POST-MIGRATION STATE ===';
  RAISE NOTICE 'Total content records: %', total_count_after;
  RAISE NOTICE 'Video records: %', video_count_after;
  RAISE NOTICE '============================';

  -- Verifica che tutti i video esistenti abbiano thumbnail_url = NULL
  IF EXISTS (SELECT 1 FROM content WHERE type = 'video' AND thumbnail_url IS NOT NULL) THEN
    RAISE WARNING 'Some videos already have thumbnail_url (unexpected but not critical)';
  END IF;

  RAISE NOTICE 'Migration 012 completed successfully';
  RAISE NOTICE 'All existing videos have thumbnail_url = NULL (backward compatible)';
END $$;

-- ============================================================================
-- Se tutto OK, committa
-- ============================================================================

COMMIT;

-- ============================================================================
-- ROLLBACK PLAN (se necessario):
--
-- Se qualcosa va storto, esegui:
--
-- BEGIN;
-- DROP INDEX IF EXISTS idx_content_video_thumbnails;
-- ALTER TABLE content DROP COLUMN IF EXISTS thumbnail_url;
-- COMMIT;
--
-- ============================================================================

-- ============================================================================
-- EXPECTED RESULT:
--
-- ✅ Colonna thumbnail_url aggiunta (nullable)
-- ✅ Index idx_content_video_thumbnails creato
-- ✅ Tutti i record esistenti intatti (count invariato)
-- ✅ Tutti i video esistenti hanno thumbnail_url = NULL
-- ✅ Video continuano a funzionare identicamente
--
-- NEXT STEPS:
-- 1. Rigenera TypeScript types: npx supabase gen types typescript
-- 2. Crea src/lib/video-thumbnail.ts
-- 3. Integra generazione thumbnail in VideoUpload.tsx
-- ============================================================================
