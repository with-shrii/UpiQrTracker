import { 
  InsertUser, User, 
  InsertQrCode, QrCode, 
  InsertTransaction, Transaction, 
  InsertStats, Stats,
  transactions
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // QR Code operations
  getQrCode(id: number): Promise<QrCode | undefined>;
  getQrCodesByUserId(userId: number): Promise<QrCode[]>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  deleteQrCode(id: number): Promise<boolean>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByQrCodeId(qrCodeId: number): Promise<Transaction[]>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Stats operations
  getStats(userId: number): Promise<Stats | undefined>;
  createOrUpdateStats(stats: InsertStats): Promise<Stats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private qrCodes: Map<number, QrCode>;
  private transactions: Map<number, Transaction>;
  private stats: Map<number, Stats>;
  
  private userIdCounter: number;
  private qrCodeIdCounter: number;
  private transactionIdCounter: number;
  private statsIdCounter: number;
  
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.qrCodes = new Map();
    this.transactions = new Map();
    this.stats = new Map();
    
    this.userIdCounter = 1;
    this.qrCodeIdCounter = 1;
    this.transactionIdCounter = 1;
    this.statsIdCounter = 1;
    
    // Create memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add demo user
    this.createUser({
      username: "demo",
      password: "password",
      upiId: "demo@okicici",
      email: "demo@example.com",
      fullName: "Demo User"
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure all fields have proper types according to schema
    const user: User = { 
      ...insertUser, 
      id,
      upiId: insertUser.upiId ?? null, 
      email: insertUser.email ?? null,
      fullName: insertUser.fullName ?? null
    };
    this.users.set(id, user);
    
    // Create initial stats for the user
    await this.createOrUpdateStats({
      userId: id,
      totalPayments: "0",
      activeQrCodes: 0,
      totalTransactions: 0,
      uniquePayers: 0
    });
    
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // QR Code Methods
  async getQrCode(id: number): Promise<QrCode | undefined> {
    return this.qrCodes.get(id);
  }

  async getQrCodesByUserId(userId: number): Promise<QrCode[]> {
    return Array.from(this.qrCodes.values()).filter(
      (qrCode) => qrCode.userId === userId,
    );
  }

  async createQrCode(insertQrCode: InsertQrCode): Promise<QrCode> {
    const id = this.qrCodeIdCounter++;
    const now = new Date();
    // Ensure all fields have proper types according to schema
    const qrCode: QrCode = { 
      ...insertQrCode, 
      id, 
      createdAt: now,
      size: insertQrCode.size || "medium",
      borderStyle: insertQrCode.borderStyle || "simple",
      amount: insertQrCode.amount ?? null,
      description: insertQrCode.description ?? null
    };
    this.qrCodes.set(id, qrCode);
    
    // Update user stats
    const userStats = await this.getStats(qrCode.userId);
    if (userStats) {
      await this.createOrUpdateStats({
        ...userStats,
        activeQrCodes: userStats.activeQrCodes + 1,
      });
    }
    
    return qrCode;
  }

  async deleteQrCode(id: number): Promise<boolean> {
    const qrCode = this.qrCodes.get(id);
    if (!qrCode) return false;
    
    // Remove QR code
    this.qrCodes.delete(id);
    
    // Update user stats
    const userStats = await this.getStats(qrCode.userId);
    if (userStats) {
      await this.createOrUpdateStats({
        ...userStats,
        activeQrCodes: userStats.activeQrCodes - 1,
      });
    }
    
    return true;
  }

  // Transaction Methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByQrCodeId(qrCodeId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.qrCodeId === qrCodeId,
    );
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    const userQrCodes = await this.getQrCodesByUserId(userId);
    const userQrCodeIds = userQrCodes.map(qr => qr.id);
    
    return Array.from(this.transactions.values()).filter(
      (transaction) => userQrCodeIds.includes(transaction.qrCodeId),
    ).sort((a, b) => {
      // Sort by timestamp in descending order (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    // Ensure all fields have proper types according to schema
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      timestamp: now,
      status: insertTransaction.status || "completed",
      payerName: insertTransaction.payerName ?? null,
      payerUpiId: insertTransaction.payerUpiId ?? null,
      metadata: insertTransaction.metadata ?? null
    };
    this.transactions.set(id, transaction);
    
    // Get the QR code to find the user
    const qrCode = await this.getQrCode(transaction.qrCodeId);
    if (qrCode) {
      // Update user stats
      const userStats = await this.getStats(qrCode.userId);
      if (userStats) {
        const allTransactions = await this.getTransactionsByUserId(qrCode.userId);
        const uniquePayerIds = new Set(allTransactions.map(t => t.payerUpiId).filter(Boolean));
        
        // Convert number to string for totalPayments
        const totalPaymentsNum = Number(userStats.totalPayments) + Number(transaction.amount);
        const totalPayments = totalPaymentsNum.toString();
        
        await this.createOrUpdateStats({
          userId: userStats.userId,
          totalPayments,
          totalTransactions: userStats.totalTransactions + 1,
          uniquePayers: uniquePayerIds.size
        });
      }
    }
    
    return transaction;
  }

  // Stats Methods
  async getStats(userId: number): Promise<Stats | undefined> {
    return Array.from(this.stats.values()).find(
      (stat) => stat.userId === userId,
    );
  }

  async createOrUpdateStats(insertStats: InsertStats): Promise<Stats> {
    const existingStats = await this.getStats(insertStats.userId);
    
    if (existingStats) {
      // Update existing stats with proper type handling
      const updatedStats: Stats = { 
        ...existingStats,
        userId: insertStats.userId,
        totalPayments: insertStats.totalPayments?.toString() ?? existingStats.totalPayments,
        activeQrCodes: typeof insertStats.activeQrCodes === 'number' ? insertStats.activeQrCodes : existingStats.activeQrCodes,
        totalTransactions: typeof insertStats.totalTransactions === 'number' ? insertStats.totalTransactions : existingStats.totalTransactions,
        uniquePayers: typeof insertStats.uniquePayers === 'number' ? insertStats.uniquePayers : existingStats.uniquePayers,
        lastUpdated: new Date() 
      };
      this.stats.set(existingStats.id, updatedStats);
      return updatedStats;
    } else {
      // Create new stats with proper type handling
      const id = this.statsIdCounter++;
      const now = new Date();
      const newStats: Stats = { 
        id,
        userId: insertStats.userId,
        totalPayments: insertStats.totalPayments?.toString() ?? "0",
        activeQrCodes: typeof insertStats.activeQrCodes === 'number' ? insertStats.activeQrCodes : 0,
        totalTransactions: typeof insertStats.totalTransactions === 'number' ? insertStats.totalTransactions : 0,
        uniquePayers: typeof insertStats.uniquePayers === 'number' ? insertStats.uniquePayers : 0,
        lastUpdated: now 
      };
      this.stats.set(id, newStats);
      return newStats;
    }
  }
}

// Import the PostgreSQL storage implementation
import { pgStorage } from './pg-storage';

// Export PostgreSQL storage as the default storage provider
export const storage = pgStorage;
