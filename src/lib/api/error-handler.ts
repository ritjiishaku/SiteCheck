import { UnauthorizedError, ForbiddenError } from '@/lib/rbac/guards'
import { z } from 'zod'

class NotFoundError extends Error {
  statusCode = 404
  constructor(message = 'Resource not found.') {
    super(message)
  }
}

class ValidationError extends Error {
  statusCode = 422
  constructor(message: string) {
    super(message)
  }
}

export { NotFoundError, ValidationError }

export function handleRouteError(err: unknown): Response {
  if (err instanceof z.ZodError) {
    return Response.json(
      { success: false, error: err.errors[0].message, code: 'VALIDATION_ERROR' },
      { status: 422 }
    )
  }
  if (err instanceof UnauthorizedError) {
    return Response.json(
      { success: false, error: err.message, code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }
  if (err instanceof ForbiddenError) {
    return Response.json(
      { success: false, error: err.message, code: 'FORBIDDEN' },
      { status: 403 }
    )
  }
  if (err instanceof NotFoundError) {
    return Response.json(
      { success: false, error: err.message, code: 'NOT_FOUND' },
      { status: 404 }
    )
  }
  if (err instanceof ValidationError) {
    return Response.json(
      { success: false, error: err.message, code: 'VALIDATION_ERROR' },
      { status: 422 }
    )
  }
  console.error('[API Error]', err instanceof Error ? err.message : err)
  return Response.json(
    { success: false, error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
