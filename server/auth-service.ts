import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { InsertUser, User } from '@shared/schema';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export class AuthService {
  // Register a new user
  async register(userData: Omit<InsertUser, 'password'> & { password: string }): Promise<User> {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user with hashed password
      const newUser = {
        ...userData,
        password: hashedPassword
      };
      
      // Insert into in-memory storage
      const user = await storage.createUser(newUser);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('User registration failed');
    }
  }

  // Login user
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return { user, token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Generate token for a user
  generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  // Verify token
  async verifyToken(token: string): Promise<{ id: number; username: string }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Get user by ID
  async getUserById(id: number): Promise<User | undefined> {
    try {
      const user = await storage.getUser(id);
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();