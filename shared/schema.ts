import { pgTable, text, serial, integer, timestamp, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  upiId: text("upi_id"),
  email: text("email"),
  fullName: text("full_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  upiId: true,
  email: true,
  fullName: true,
});

// QR Code schema
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  upiId: text("upi_id").notNull(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  description: text("description"),
  size: text("size").notNull().default("medium"),
  borderStyle: text("border_style").notNull().default("simple"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  qrData: text("qr_data").notNull(),
});

export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  createdAt: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  qrCodeId: integer("qr_code_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  payerName: text("payer_name"),
  payerUpiId: text("payer_upi_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").notNull().default("completed"),
  metadata: json("metadata"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

// Stats schema for dashboards
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalPayments: numeric("total_payments", { precision: 10, scale: 2 }).notNull().default("0"),
  activeQrCodes: integer("active_qr_codes").notNull().default(0),
  totalTransactions: integer("total_transactions").notNull().default(0),
  uniquePayers: integer("unique_payers").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertStatsSchema = createInsertSchema(stats).omit({
  id: true,
  lastUpdated: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type QrCode = typeof qrCodes.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Stats = typeof stats.$inferSelect;
export type InsertStats = z.infer<typeof insertStatsSchema>;
