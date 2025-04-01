import { eq, and, desc } from 'drizzle-orm';
import { db, pool } from './db';
import { 
  users, 
  qrCodes, 
  transactions, 
  stats,
  User,
  InsertUser,
  QrCode,
  InsertQrCode,
  Transaction,
  InsertTransaction,
  Stats,
  InsertStats
} from '@shared/schema';
import { IStorage } from './storage';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

export class PgStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    // Create PostgreSQL session store
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    return result;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [result] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  // QR Code operations
  async getQrCode(id: number): Promise<QrCode | undefined> {
    const result = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.id, id)
    });
    return result;
  }

  async getQrCodesByUserId(userId: number): Promise<QrCode[]> {
    const results = await db.query.qrCodes.findMany({
      where: eq(qrCodes.userId, userId),
      orderBy: [desc(qrCodes.createdAt)]
    });
    return results;
  }

  async createQrCode(qrCode: InsertQrCode): Promise<QrCode> {
    const [result] = await db.insert(qrCodes).values(qrCode).returning();
    return result;
  }

  async deleteQrCode(id: number): Promise<boolean> {
    // First delete all related transactions
    await db.delete(transactions).where(eq(transactions.qrCodeId, id));
    
    // Then delete the QR code
    const result = await db.delete(qrCodes).where(eq(qrCodes.id, id)).returning();
    return result.length > 0;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.query.transactions.findFirst({
      where: eq(transactions.id, id)
    });
    return result;
  }

  async getTransactionsByQrCodeId(qrCodeId: number): Promise<Transaction[]> {
    const results = await db.query.transactions.findMany({
      where: eq(transactions.qrCodeId, qrCodeId),
      orderBy: [desc(transactions.timestamp)]
    });
    return results;
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    // We need to join with qrCodes to filter by userId
    const qrCodesList = await this.getQrCodesByUserId(userId);
    
    if (qrCodesList.length === 0) {
      return [];
    }
    
    // Get all qrCodeIds for this user
    const qrCodeIds = qrCodesList.map(qr => qr.id);
    
    // Fetch transactions for these QR codes
    const results: Transaction[] = [];
    for (const qrId of qrCodeIds) {
      const txs = await this.getTransactionsByQrCodeId(qrId);
      results.push(...txs);
    }
    
    // Sort by timestamp (newest first)
    return results.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [result] = await db.insert(transactions).values(transaction).returning();
    
    // Update stats after transaction is created
    const qrCode = await this.getQrCode(transaction.qrCodeId);
    if (qrCode) {
      await this.updateStatsAfterTransaction(qrCode.userId, Number(transaction.amount));
    }
    
    return result;
  }
  
  // Stats operations
  async getStats(userId: number): Promise<Stats | undefined> {
    const result = await db.query.stats.findFirst({
      where: eq(stats.userId, userId)
    });
    
    if (!result) {
      // If no stats exist yet, generate them
      return this.generateStats(userId);
    }
    
    return result;
  }

  async createOrUpdateStats(statsData: InsertStats): Promise<Stats> {
    // Check if stats already exist for this user
    const existingStats = await db.query.stats.findFirst({
      where: eq(stats.userId, statsData.userId)
    });
    
    if (existingStats) {
      // Update existing stats
      const [result] = await db
        .update(stats)
        .set({
          ...statsData,
          lastUpdated: new Date()
        })
        .where(eq(stats.id, existingStats.id))
        .returning();
      return result;
    } else {
      // Create new stats
      const [result] = await db
        .insert(stats)
        .values({
          ...statsData,
          lastUpdated: new Date()
        })
        .returning();
      return result;
    }
  }

  // Helper methods
  private async updateStatsAfterTransaction(userId: number, amount: number): Promise<void> {
    const userStats = await this.getStats(userId);
    
    if (userStats) {
      // Get updated counts
      const qrCodes = await this.getQrCodesByUserId(userId);
      const transactions = await this.getTransactionsByUserId(userId);
      
      // Get unique payers
      const uniquePayerUpiIds = new Set<string>();
      transactions.forEach(tx => {
        if (tx.payerUpiId) {
          uniquePayerUpiIds.add(tx.payerUpiId);
        }
      });
      
      // Calculate total payments
      const totalPayments = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      // Update stats
      await this.createOrUpdateStats({
        userId,
        totalPayments: totalPayments.toString(),
        activeQrCodes: qrCodes.length,
        totalTransactions: transactions.length,
        uniquePayers: uniquePayerUpiIds.size
      });
    }
  }

  private async generateStats(userId: number): Promise<Stats> {
    // Get all QR codes for this user
    const qrCodes = await this.getQrCodesByUserId(userId);
    
    // Get all transactions for this user
    const transactions = await this.getTransactionsByUserId(userId);
    
    // Get unique payers
    const uniquePayerUpiIds = new Set<string>();
    transactions.forEach(tx => {
      if (tx.payerUpiId) {
        uniquePayerUpiIds.add(tx.payerUpiId);
      }
    });
    
    // Calculate total payments
    const totalPayments = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    // Create stats object
    const newStats: InsertStats = {
      userId,
      totalPayments: totalPayments.toString(),
      activeQrCodes: qrCodes.length,
      totalTransactions: transactions.length,
      uniquePayers: uniquePayerUpiIds.size
    };
    
    // Save to database
    return this.createOrUpdateStats(newStats);
  }
}

export const pgStorage = new PgStorage();