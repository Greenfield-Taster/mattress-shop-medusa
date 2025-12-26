import jwt, { SignOptions } from "jsonwebtoken"

/**
 * JWT Token Payload
 */
export interface TokenPayload {
  userId: string
  iat?: number
  exp?: number
}

/**
 * Отримати JWT_SECRET з env
 */
function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not configured in environment variables")
  }
  return secret
}

/**
 * Генерувати JWT токен для користувача
 * @param userId - ID користувача
 * @param expiresIn - час життя токена (за замовчуванням 7 днів)
 */
export function generateToken(userId: string, expiresInSeconds: number = 7 * 24 * 60 * 60): string {
  const payload: TokenPayload = { userId }
  const options: SignOptions = { expiresIn: expiresInSeconds }
  return jwt.sign(payload, getSecret(), options)
}

/**
 * Верифікувати JWT токен
 * @param token - JWT токен
 * @returns payload якщо токен валідний, null якщо невалідний
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Витягти токен з Authorization header
 * @param authHeader - значення Authorization header
 * @returns токен або null
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return null

  return parts[1]
}
