import { Request } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// Extract user from token and add to context
export const getUserFromToken = async (req: Request): Promise<IUser | null> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    const jwtSecret = process.env.JWT_SECRET || '';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    return await User.findById(decoded.userId);
  } catch (error) {
    return null;
  }
};

// GraphQL context middleware
export const createContext = async ({ req }: { req: Request }) => {
  const user = await getUserFromToken(req);
  return { req, user };
};
