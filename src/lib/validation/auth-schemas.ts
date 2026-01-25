/**
 * Authentication validation schemas
 * Used for registration, login, and password validation
 */

import { z } from 'zod'
import { ERROR_MESSAGES } from './messages'

/**
 * Email validation with custom Italian message
 * Trims whitespace and converts to lowercase
 */
export const emailSchema = z
  .string()
  .email(ERROR_MESSAGES.auth.invalidEmail)
  .trim()
  .toLowerCase()

/**
 * Password validation
 * Minimum 6 characters
 */
export const passwordSchema = z
  .string()
  .min(6, ERROR_MESSAGES.auth.passwordTooShort)

/**
 * Full name validation
 * Minimum 2 characters (e.g., "A B" is valid)
 */
export const fullNameSchema = z
  .string()
  .min(2, ERROR_MESSAGES.auth.fullNameTooShort)
  .trim()

/**
 * Registration schema with honeypot field
 * The "website" field should remain empty (filled only by bots)
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
    website: z.string().optional(), // Honeypot field
  })
  .refine((data) => !data.website, {
    message: ERROR_MESSAGES.auth.invalidRegistration,
    path: ['website'],
  })

/**
 * Login schema
 * Email + password (no minimum length check for login)
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, ERROR_MESSAGES.auth.passwordRequired),
})

/**
 * Password confirmation schema for client-side forms
 * Ensures password and confirmPassword match
 */
export const passwordConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ERROR_MESSAGES.auth.passwordMismatch,
    path: ['confirmPassword'],
  })

/**
 * Inferred TypeScript types from schemas
 * Use these types in your components and server actions
 */
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type PasswordConfirmInput = z.infer<typeof passwordConfirmSchema>
