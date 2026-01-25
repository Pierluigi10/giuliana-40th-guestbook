/**
 * Centralized validation schemas
 * Barrel export for all Zod validation schemas
 *
 * Import from this file to get all schemas in one place:
 * @example
 * ```typescript
 * import { emailSchema, registerSchema, textContentSchema } from '@/lib/validation/schemas'
 * ```
 */

// Auth schemas
export * from './auth-schemas'

// Content schemas
export * from './content-schemas'

// Error messages
export { ERROR_MESSAGES } from './messages'

// Validation utilities
export * from './validate-action'

// Re-export Zod for convenience
export { z } from 'zod'
