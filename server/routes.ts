import type { Express, Request, Response, NextFunction } from "express";
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
import { authService } from "./auth-service";
import { authenticate, optionalAuthenticate } from "./auth-middleware";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // API prefix
  const API_PREFIX = "/api";

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
  
  // Auth routes
  app.post(`${API_PREFIX}/register`, async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await authService.register(userData);
      
      // Create initial stats for the user
      await storage.createOrUpdateStats({
        userId: user.id,
        totalPayments: "0",
        activeQrCodes: 0,
        totalTransactions: 0,
        uniquePayers: 0
      });
      
      return res.status(201).json({ user });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post(`${API_PREFIX}/login`, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      const { user, token } = await authService.login(username, password);
      return res.status(200).json({ user, token });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      handleError(res, error);
    }
  });
  
  app.get(`${API_PREFIX}/user`, authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const user = await authService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  app.post(`${API_PREFIX}/logout`, (req: Request, res: Response) => {
    // Since we're using JWT, there's no server-side logout
    // Just return success and the client will remove the token
    return res.status(200).json({ message: 'Logged out successfully' });
  });
  
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
      // First generate the QR code
      const qrRequestData = req.body;
      
      // Generate QR code
      const generatedQR = await qrCodeService.generateQRCode({
        upiId: qrRequestData.upiId,
        name: qrRequestData.name,
        amount: qrRequestData.amount || '',
        description: qrRequestData.description || "",
        size: qrRequestData.size,
        borderStyle: qrRequestData.borderStyle
      });
      
      // Then add the qrData to the payload before validation
      const fullQrCodeData = {
        ...qrRequestData,
        qrData: generatedQR.data
      };
      
      // Validate the complete data
      const validatedData = insertQrCodeSchema.parse(fullQrCodeData);
      
      // Save QR code to storage
      const qrCode = await storage.createQrCode(validatedData);
      
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
