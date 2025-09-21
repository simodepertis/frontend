import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Controlla anche nei cookies
  const tokenCookie = request.cookies.get('auth-token')
  return tokenCookie?.value || null
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('La password deve essere di almeno 6 caratteri')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('La password deve contenere almeno un numero')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function getAuth(request: NextRequest): Promise<{ userId: number; email: string } | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}
