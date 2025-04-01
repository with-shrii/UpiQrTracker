import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { authService } from "./auth-service";
import { pgStorage } from "./pg-storage";
import { authenticate } from "./auth-middleware";
import { User as SchemaUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SchemaUser {}
  }
}

export function setupAuth(app: Express) {
  // Configure session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "upi-qr-tracker-secret-key",
    resave: false,
    saveUninitialized: false,
    store: pgStorage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure LocalStrategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const { user } = await authService.login(username, password);
        return done(null, user);
      } catch (error) {
        return done(null, false, { message: "Invalid credentials" });
      }
    })
  );

  // Used to serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Used to deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await authService.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register auth-related API endpoints
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Username and password are validated by LocalStrategy
    // Create a token for API access
    const token = authService.generateToken(req.user as SchemaUser);
    res.status(200).json({ user: req.user, token });
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", authenticate, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const user = await authService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove password before sending
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}