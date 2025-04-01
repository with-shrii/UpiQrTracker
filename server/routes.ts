import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { qrCodeService } from "./qr-service";
import { 
  insertQrCodeSchema, 
  insertTransactionSchema, 
  insertUserSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const API_PREFIX = "/api";

  // Health check route
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('Server is healthy!');
  });

  // Error handling middleware
  function handleError(res: Response, error: unknown) {
    console.error(error);
    
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }

  // API endpoints
  
  // User routes
  app.post(`${API_PREFIX}/users`, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      return res.status(201).json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${API_PREFIX}/users/:id`, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  // QR Code routes
  app.post(`${API_PREFIX}/qr-codes`, async (req: Request, res: Response) => {
    try {
      const qrCodeData = insertQrCodeSchema.parse(req.body);
      
      // Generate QR code
      const generatedQR = await qrCodeService.generateQRCode({
        upiId: qrCodeData.upiId,
        name: qrCodeData.name,
        amount: qrCodeData.amount ? qrCodeData.amount.toString() : undefined,
        description: qrCodeData.description || "",
        size: qrCodeData.size,
        borderStyle: qrCodeData.borderStyle
      });
      
      // Save QR code to storage
      const qrCode = await storage.createQrCode({
        ...qrCodeData,
        qrData: generatedQR.data
      });
      
      return res.status(201).json(qrCode);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${API_PREFIX}/qr-codes/:id`, async (req: Request, res: Response) => {
    try {
      const qrCodeId = parseInt(req.params.id);
      const qrCode = await storage.getQrCode(qrCodeId);
      
      if (!qrCode) {
        return res.status(404).json({ error: 'QR code not found' });
      }
      
      return res.json(qrCode);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${API_PREFIX}/users/:userId/qr-codes`, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const qrCodes = await storage.getQrCodesByUserId(userId);
      return res.json(qrCodes);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete(`${API_PREFIX}/qr-codes/:id`, async (req: Request, res: Response) => {
    try {
      const qrCodeId = parseInt(req.params.id);
      const success = await storage.deleteQrCode(qrCodeId);
      
      if (!success) {
        return res.status(404).json({ error: 'QR code not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Transaction routes
  app.post(`${API_PREFIX}/transactions`, async (req: Request, res: Response) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      return res.status(201).json(transaction);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${API_PREFIX}/transactions/:id`, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      return res.json(transaction);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${API_PREFIX}/qr-codes/:qrCodeId/transactions`, async (req: Request, res: Response) => {
    try {
      const qrCodeId = parseInt(req.params.qrCodeId);
      const transactions = await storage.getTransactionsByQrCodeId(qrCodeId);
      return res.json(transactions);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${API_PREFIX}/users/:userId/transactions`, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await storage.getTransactionsByUserId(userId);
      return res.json(transactions);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Stats routes
  app.get(`${API_PREFIX}/users/:userId/stats`, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getStats(userId);
      
      if (!stats) {
        return res.status(404).json({ error: 'Stats not found' });
      }
      
      return res.json(stats);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Demo data - For development purposes
  app.post(`${API_PREFIX}/demo-data`, async (req: Request, res: Response) => {
    try {
      // Create a demo user if not exists
      let user = await storage.getUserByUsername("demo");
      
      if (!user) {
        user = await storage.createUser({
          username: "demo",
          password: "password",
          upiId: "demo@okicici",
          email: "demo@example.com",
          fullName: "Demo User"
        });
      }
      
      // Create demo QR codes using the QR service
      const qrCode1Data = await qrCodeService.generateQRCode({
        upiId: user.upiId || "demo@okicici",
        name: "Grocery Store QR",
        description: "Payments for groceries",
        size: "medium",
        borderStyle: "simple"
      });
      
      const qrCode1 = await storage.createQrCode({
        userId: user.id,
        upiId: user.upiId || "demo@okicici",
        name: "Grocery Store QR",
        amount: "0",
        description: "Payments for groceries",
        size: "medium",
        borderStyle: "simple",
        qrData: qrCode1Data.data
      });
      
      const qrCode2Data = await qrCodeService.generateQRCode({
        upiId: user.upiId || "demo@okicici",
        name: "Restaurant QR",
        description: "Payments for restaurant",
        size: "medium",
        borderStyle: "rounded"
      });
      
      const qrCode2 = await storage.createQrCode({
        userId: user.id,
        upiId: user.upiId || "demo@okicici",
        name: "Restaurant QR",
        amount: "0",
        description: "Payments for restaurant",
        size: "medium",
        borderStyle: "rounded",
        qrData: qrCode2Data.data
      });
      
      const qrCode3Data = await qrCodeService.generateQRCode({
        upiId: user.upiId || "demo@okicici",
        name: "Website QR",
        amount: "1000",
        description: "Donations for website",
        size: "large",
        borderStyle: "fancy"
      });
      
      const qrCode3 = await storage.createQrCode({
        userId: user.id,
        upiId: user.upiId || "demo@okicici",
        name: "Website QR",
        amount: "1000",
        description: "Donations for website",
        size: "large",
        borderStyle: "fancy",
        qrData: qrCode3Data.data
      });
      
      // Create demo transactions
      await storage.createTransaction({
        qrCodeId: qrCode1.id,
        amount: "1250",
        payerName: "Amit Kumar",
        payerUpiId: "amit@okaxis",
        status: "completed",
        metadata: {}
      });
      
      await storage.createTransaction({
        qrCodeId: qrCode2.id,
        amount: "850",
        payerName: "Preeti Singh",
        payerUpiId: "preeti@okhdfcbank",
        status: "completed",
        metadata: {}
      });
      
      await storage.createTransaction({
        qrCodeId: qrCode3.id,
        amount: "2000",
        payerName: "Vikram Patel",
        payerUpiId: "vikram@oksbi",
        status: "completed",
        metadata: {}
      });
      
      await storage.createTransaction({
        qrCodeId: qrCode1.id,
        amount: "500",
        payerName: "Neha Gupta",
        payerUpiId: "neha@okpnb",
        status: "completed",
        metadata: {}
      });
      
      await storage.createTransaction({
        qrCodeId: qrCode2.id,
        amount: "1800",
        payerName: "Rajesh Khanna",
        payerUpiId: "rajesh@okicici",
        status: "completed",
        metadata: {}
      });
      
      return res.status(201).json({ message: 'Demo data created successfully' });
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
