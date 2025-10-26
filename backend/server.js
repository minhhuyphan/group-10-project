require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const app = express();

// Import middlewares
const { requestLogger, errorLogger } = require('./middleware/loggingMiddleware');
const { generalRateLimiter, authRateLimiter, refreshTokenRateLimiter } = require('./middleware/rateLimitMiddleware');

// Import Cloudinary config
const { testConnection } = require('./config/cloudinary');

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "http://127.0.0.1:3000",
      "https://group-10-project.vercel.app", // Production frontend
      "https://*.vercel.app" // All Vercel preview deployments
    ],
    credentials: true,
  })
);

// Increase JSON body size limit to allow base64 avatar data to be sent
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Apply logging middleware
app.use(requestLogger);

// Apply general rate limiting
app.use(generalRateLimiter);

// Routes
const userRoutes = require("./routes/user");
app.use("/api", userRoutes);

// Authentication routes với rate limiting riêng
const authRoutes = require("./routes/authRoutes");
app.use("/auth/login", authRateLimiter);
app.use("/auth/refresh", refreshTokenRateLimiter);
app.use("/auth", authRoutes);

// Activity Log routes - SV1
const activityRoutes = require("./routes/activityRoutes");
app.use("/api/activity", activityRoutes);

// Redux Support routes - SV1 Backend Support
const reduxRoutes = require("./routes/reduxRoutes");
app.use("/api", reduxRoutes);

// Avatar routes
const avatarRoutes = require("./routes/avatarRoutes");
app.use("/api/users", avatarRoutes);
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res
        .status(401)
        .json({
          message: "Access token not provided",
          error: "No token provided",
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({
          message: "Invalid token or user not found",
          error: "Invalid token",
        });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res
      .status(403)
      .json({ message: "Invalid token", error: "Invalid token" });
  }
};

// -----------------------------
// Profile routes (GET, PUT)
// -----------------------------
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile fetched", user: user.profile });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, age, avatar } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (age !== undefined) update.age = parseInt(age);

    // If avatar is a data URL (base64), parse and store binary + mime
    if (avatar !== undefined) {
      if (typeof avatar === 'string' && avatar.startsWith('data:')) {
        const matches = avatar.match(/^data:(.+);base64,(.*)$/);
        if (matches) {
          const mime = matches[1];
          const b64 = matches[2];
          const buf = Buffer.from(b64, 'base64');
          update.avatarData = buf;
          update.avatarMime = mime;
          // also clear textual avatar field or keep for external URL
          update.avatar = null;
        } else {
          // Not a well-formed data URL — save raw string
          update.avatar = avatar;
        }
      } else {
        // Not base64 — likely a URL
        update.avatar = avatar;
        update.avatarData = null;
        update.avatarMime = null;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated", user: updatedUser.profile });
  } catch (err) {
    console.error("Update profile error:", err.message);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ message: messages.join(", "), error: "Validation error" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add a test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Debug route: list registered routes (development only)
app.get('/_debug_routes', (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // routes registered directly on the app
        const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
        routes.push({ path: middleware.route.path, methods });
      } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
        // router middleware
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
            routes.push({ path: handler.route.path, methods });
          }
        });
      }
    });
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  await connectDB();
});
