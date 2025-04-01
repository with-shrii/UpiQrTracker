import { Request, Response, NextFunction } from 'express';
import { authService } from './auth-service';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = await authService.verifyToken(token);
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication middleware (doesn't require auth but adds user to request if token is present)
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = await authService.verifyToken(token);
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
  } catch (error) {
    // In optional authentication, we don't throw an error if the token is invalid
    console.warn('Optional authentication failed:', error);
  }
  
  next();
};