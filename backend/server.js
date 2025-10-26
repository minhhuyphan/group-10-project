require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const app = express();

// Import middlewares
const {
  requestLogger,
  errorLogger,
} = require("./middleware/loggingMiddleware");
const {
  generalRateLimiter,
  authRateLimiter,
  refreshTokenRateLimiter,
} = require("./middleware/rateLimitMiddleware");

// Import Cloudinary config
const { testConnection } = require("./config/cloudinary");

// Middleware
const allowedOrigins = [
  "http://localhost:3000", 
  "http://127.0.0.1:3000",
  "https://group-10-project-nine.vercel.app", // Frontend production URL
  process.env.FRONTEND_PRODUCTION_URL
].filter(Boolean).filter((origin, index, arr) => arr.indexOf(origin) === index); // Remove duplicates

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Increase JSON body size limit to allow base64 avatar data to be sent
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Apply logging middleware
app.use(requestLogger);

// Apply general rate limiting
app.use(generalRateLimiter);

// Routes - Reorganized to avoid conflicts
const userRoutes = require("./routes/user");
app.use("/api", userRoutes);

// Add direct /users route for frontend compatibility
const userController = require("./controllers/usercontroller");
const { authenticateAccessToken, checkRole } = require("./middleware/authMiddleware");

app.get("/users", userController.getUsers);
app.post("/users", authenticateAccessToken, checkRole(['admin', 'moderator']), userController.createUser);
app.put("/users/:id", authenticateAccessToken, checkRole(['admin', 'moderator']), userController.updateUser);
app.delete("/users/:id", authenticateAccessToken, checkRole(['admin']), userController.deleteUser);

// Authentication routes với rate limiting riêng
const authRoutes = require("./routes/authRoutes");
app.use("/auth/login", authRateLimiter);
app.use("/auth/refresh", refreshTokenRateLimiter);
app.use("/auth", authRoutes);

// Activity Log routes - SV1
const activityRoutes = require("./routes/activityRoutes");
app.use("/api/activity", activityRoutes);

// Redux Support routes - SV1 Backend Support (separated to avoid conflicts)
const reduxRoutes = require("./routes/reduxRoutes");
app.use("/api/redux", reduxRoutes);

// Avatar routes - mount at /api/avatars to avoid conflicts
const avatarRoutes = require("./routes/avatarRoutes");
app.use("/api/avatars", avatarRoutes);

// Profile routes are handled by reduxRoutes.js - removed duplicates

// Root endpoint for Render health checks
app.get("/", (req, res) => {
  res.json({ 
    message: "Group 10 Project Backend API",
    status: "OK",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    mongoConnected: isMongoConnected,
    availableRoutes: [
      "GET /health - Health check",
      "GET /users - Get all users", 
      "GET /api/users - Get all users (API)",
      "PUT /api/users/:id - Update user by ID",
      "POST /api/avatars/upload - Upload user avatar",
      "GET /api/avatars/:id - Get user avatar",
      "POST /auth/login - User login",
      "POST /auth/signup - User signup",
      "GET /_debug_routes - List all routes"
    ]
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    mongoConnected: isMongoConnected,
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add a test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// CORS debug endpoint
app.get("/cors-test", (req, res) => {
  res.json({ 
    message: "CORS test successful",
    origin: req.get('origin'),
    allowedOrigins: allowedOrigins
  });
});

// Debug route: list registered routes (development only)
app.get("/_debug_routes", (req, res) => {
  res.json({ 
    message: "Available API endpoints",
    directRoutes: [
      "GET / - API Info",
      "GET /health - Health check", 
      "GET /users - Get all users",
      "POST /api/users - Create user (admin/moderator)",
      "PUT /api/users/:id - Update user (admin/moderator)",
      "DELETE /api/users/:id - Delete user (admin)",
      "POST /api/avatars/upload - Upload avatar",
      "GET /api/avatars/:id - Get avatar",
      "POST /auth/login - User login",
      "POST /auth/signup - User signup"
    ],
    mountedRoutes: [
      "/api - userRoutes", 
      "/auth - authRoutes",
      "/api/activity - activityRoutes",
      "/api - reduxRoutes",
      "/api/avatars - avatarRoutes"
    ]
  });
});

const PORT = process.env.PORT || 10000;

// Global variable to track MongoDB connection status
let isMongoConnected = false;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    isMongoConnected = true;
    console.log("✅ Connected to MongoDB successfully!");

    // Test Cloudinary connection
    console.log("Testing Cloudinary connection...");
    await testConnection();

    // Setup default users for Redux Protected Routes testing
    const { setupDefaultUsers } = require("./middleware/setupAdmin");
    await setupDefaultUsers();
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("🔄 Falling back to mock data mode");
    isMongoConnected = false;
  }
};

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.get('origin'),
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  await connectDB();
});
