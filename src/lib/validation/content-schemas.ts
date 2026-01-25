/**
 * Content validation schemas
 * Used for text, image, and video content uploads
 */

import { z } from 'zod'
import { ERROR_MESSAGES } from './messages'

/**
 * Text content validation
 * Minimum 10 characters, maximum 1000 characters
 * Automatically trims whitespace
 */
export const textContentSchema = z
  .string()
  .min(10, ERROR_MESSAGES.text.tooShort)
  .max(1000, ERROR_MESSAGES.text.tooLong)
  .trim()

/**
 * Text upload payload schema
 * Used by server action uploadTextContent()
 * Note: userId is validated as UUID format
 */
export const textUploadSchema = z.object({
  textContent: textContentSchema,
  userId: z.string().uuid(ERROR_MESSAGES.common.invalidId),
})

/**
 * Inferred TypeScript types from schemas
 */
export type TextUploadInput = z.infer<typeof textUploadSchema>
