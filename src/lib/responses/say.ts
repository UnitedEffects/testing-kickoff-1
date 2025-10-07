import { NextResponse } from 'next/server'

/**
 * Standard JSON response helper
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 */
export function say(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Error response helper
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @param details - Optional error details
 */
export function sayError(message: string, status = 400, details?: unknown) {
  const response: { error: string; details?: unknown } = { error: message }
  if (details) {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

/**
 * Success response helper with message
 * @param message - Success message
 * @param data - Optional data payload
 */
export function saySuccess(message: string, data?: unknown) {
  const response: { success: boolean; message: string; data?: unknown } = {
    success: true,
    message,
  }
  if (data) {
    response.data = data
  }
  return NextResponse.json(response, { status: 200 })
}

/**
 * Not found response helper
 * @param resource - Name of the resource that was not found
 */
export function sayNotFound(resource: string) {
  return sayError(`${resource} not found`, 404)
}

/**
 * Forbidden response helper
 * @param message - Optional custom message (default: 'Forbidden')
 */
export function sayForbidden(message = 'Forbidden') {
  return sayError(message, 403)
}

/**
 * Unauthorized response helper
 * @param message - Optional custom message (default: 'Unauthorized')
 */
export function sayUnauthorized(message = 'Unauthorized') {
  return sayError(message, 401)
}
