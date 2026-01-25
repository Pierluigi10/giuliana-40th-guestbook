/**
 * Server action validation utilities
 * Provides type-safe wrappers for validating server actions with Zod
 */

import { z } from 'zod'
import { ERROR_MESSAGES } from './messages'

/**
 * Standard action result type
 * All server actions should return this structure
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Validates server action input with Zod schema
 * Automatically handles Zod validation errors and returns Italian error messages
 *
 * @param schema - Zod schema to validate input against
 * @param action - Server action function to execute with validated data
 * @returns Wrapped action that validates input before execution
 *
 * @example
 * ```typescript
 * export const uploadText = validateAction(
 *   textUploadSchema,
 *   async ({ textContent, userId }) => {
 *     // Input is already validated and type-safe
 *     const result = await insertContent(textContent, userId)
 *     return { success: true, data: result }
 *   }
 * )
 * ```
 */
export function validateAction<TSchema extends z.ZodTypeAny, TResult>(
  schema: TSchema,
  action: (data: z.infer<TSchema>) => Promise<ActionResult<TResult>>
) {
  return async (input: unknown): Promise<ActionResult<TResult>> => {
    try {
      // Validate input against schema
      const validated = schema.parse(input)
      // Execute action with validated data
      return await action(validated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Return first validation error in Italian
        const firstError = error.issues[0]
        return { success: false, error: firstError.message }
      }
      // Unexpected error
      console.error('Validation error:', error)
      return { success: false, error: ERROR_MESSAGES.common.serverError }
    }
  }
}

/**
 * Type-safe wrapper for creating validated actions
 * Provides better TypeScript inference for action creators
 *
 * @example
 * ```typescript
 * export const createUser = createValidatedAction(
 *   registerSchema,
 *   async ({ email, password, fullName }) => {
 *     // Validated input with full type safety
 *     // ...
 *   }
 * )
 * ```
 */
export function createValidatedAction<TSchema extends z.ZodTypeAny, TResult>(
  schema: TSchema,
  action: (data: z.infer<TSchema>) => Promise<ActionResult<TResult>>
) {
  return validateAction(schema, action)
}

/**
 * Safe parse utility for client-side validation
 * Returns typed validation result with user-friendly error message
 *
 * @example
 * ```typescript
 * const result = safeValidate(emailSchema, userInput)
 * if (result.success) {
 *   console.log(result.data) // Type-safe validated data
 * } else {
 *   console.error(result.error) // Italian error message
 * }
 * ```
 */
export function safeValidate<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown
): { success: true; data: z.infer<TSchema> } | { success: false; error: string } {
  const result = schema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.issues[0].message }
}
