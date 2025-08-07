import jwt from 'jsonwebtoken'
import { UserAttributes } from '../models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

export interface JwtPayload {
  userId: number
  username: string
  role: string
  iat?: number
  exp?: number
}

export const generateToken = (user: UserAttributes): string => {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch (error) {
    return null
  }
}
