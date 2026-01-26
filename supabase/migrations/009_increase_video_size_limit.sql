-- Migration: Increase video file size limit from 10MB to 20MB
-- Date: 2026-01-26
-- Purpose: Allow larger video uploads with improved compression messaging

-- Update storage bucket file size limit from 10MB (10485760 bytes) to 20MB (20971520 bytes)
UPDATE storage.buckets
SET file_size_limit = 20971520
WHERE id = 'content-media';

-- Verify the update
SELECT id, file_size_limit, file_size_limit / 1024 / 1024 AS size_mb
FROM storage.buckets
WHERE id = 'content-media';
