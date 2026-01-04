import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
  return jwt.sign({ userId }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
  });
};
