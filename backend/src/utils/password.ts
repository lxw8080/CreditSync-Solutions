import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 6) {
    errors.push('密码长度至少6位')
  }

  if (password.length > 50) {
    errors.push('密码长度不能超过50位')
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('密码必须包含字母')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
