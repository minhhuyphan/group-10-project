// backend/controllers/reduxController.js
/**
 * Redux Support Controller - SV1
 * API endpoints để hỗ trợ Redux frontend với Protected Routes
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../middleware/activityLogMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

/**
 * Verify Token & Get User Profile
 * Endpoint cho Redux để verify token và lấy user info
 */
exports.verifyToken = async (req, res) => {
  try {
    // Token đã được verify trong middleware, user info trong req.user
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log activity
    logActivity(user._id.toString(), 'TOKEN_VERIFY', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { endpoint: '/verify-token' }
    });

    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      tokenInfo: {
        issuedAt: new Date(req.user.iat * 1000),
        expiresAt: new Date(req.user.exp * 1000)
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
    // Log error
    logActivity(req.user?.id || 'unknown', 'TOKEN_VERIFY_ERROR', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { error: error.message }
    });

    res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: error.message
    });
  }
};

/**
 * Get User Profile (Protected Route)
 * API cho /profile route
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('refreshTokens', 'token createdAt expiresAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Log activity
    logActivity(user._id.toString(), 'PROFILE_VIEW', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { endpoint: '/profile' }
    });

    // Calculate active sessions
    const activeSessions = user.refreshTokens ? user.refreshTokens.filter(
      token => new Date(token.expiresAt) > new Date()
    ).length : 0;

    res.json({
      success: true,
      data: {
        profile: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          isAdmin: user.isAdmin || false,
          avatar: user.avatar,
          bio: user.bio || '',
          phone: user.phone || '',
          address: user.address || '',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
          isActive: user.isActive
        },
        sessionInfo: {
          activeSessions,
          currentSessionIP: req.ip || req.connection.remoteAddress,
          currentSessionAgent: req.get('user-agent'),
          loginTime: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    // Log error
    logActivity(req.user?.id || 'unknown', 'PROFILE_VIEW_ERROR', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { error: error.message }
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

/**
 * Update User Profile (Protected Route)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, address } = req.body;
    
    // Validate input
    const updates = {};
    if (name) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (address !== undefined) updates.address = address.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log activity
    logActivity(user._id.toString(), 'PROFILE_UPDATE', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { 
        updatedFields: Object.keys(updates),
        endpoint: '/profile'
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          isAdmin: user.isAdmin || false,
          avatar: user.avatar,
          bio: user.bio || '',
          phone: user.phone || '',
          address: user.address || '',
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Log error
    logActivity(req.user?.id || 'unknown', 'PROFILE_UPDATE_ERROR', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { error: error.message }
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Admin Dashboard Data (Protected Route - Admin Only)
 */
exports.getAdminDashboard = async (req, res) => {
  try {
    // Check admin permission
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      // Log unauthorized access attempt
      logActivity(req.user.id, 'ADMIN_ACCESS_DENIED', new Date(), {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        details: { 
          endpoint: '/admin/dashboard',
          reason: 'Insufficient permissions'
        }
      });

      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get dashboard statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt lastLogin');

    // User growth stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Active sessions (users logged in last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const activeSessionsToday = await User.countDocuments({
      lastLogin: { $gte: oneDayAgo }
    });

    // Log activity
    logActivity(req.user.id, 'ADMIN_DASHBOARD_VIEW', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { endpoint: '/admin/dashboard' }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          newUsersThisWeek,
          activeSessionsToday
        },
        recentUsers: recentUsers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          joinDate: user.createdAt,
          lastLogin: user.lastLogin
        })),
        statistics: {
          userGrowthRate: totalUsers > 0 ? (newUsersThisWeek / totalUsers * 100).toFixed(2) : 0,
          activeRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0,
          dailyActiveRate: totalUsers > 0 ? (activeSessionsToday / totalUsers * 100).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    
    // Log error
    logActivity(req.user?.id || 'unknown', 'ADMIN_DASHBOARD_ERROR', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { error: error.message }
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};

/**
 * Get All Users (Admin Only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Check admin permission
    if (!req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalUsers = await User.countDocuments(query);

    // Log activity
    logActivity(req.user.id, 'ADMIN_VIEW_USERS', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { 
        endpoint: '/admin/users',
        page,
        limit,
        search,
        status,
        totalFound: totalUsers
      }
    });

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          isAdmin: user.isAdmin || false,
          isActive: user.isActive,
          avatar: user.avatar,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

/**
 * Check Route Access (Helper for Protected Routes)
 */
const checkRouteAccess = async (req, res) => {
  try {
    // Get route from request body
    const { route } = req.body;
    if (!route) {
      return res.status(400).json({
        success: false,
        message: 'Route is required',
        hasAccess: false
      });
    }
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        hasAccess: false
      });
    }

    let hasAccess = true;
    let requiredRole = 'user';

    // Define route access rules
    const routeRules = {
      '/profile': { requiredRole: 'user', adminRequired: false },
      '/admin': { requiredRole: 'admin', adminRequired: true },
      '/admin/dashboard': { requiredRole: 'admin', adminRequired: true },
      '/admin/users': { requiredRole: 'admin', adminRequired: true }
    };

    const rule = routeRules[route];
    if (rule) {
      requiredRole = rule.requiredRole;
      if (rule.adminRequired && !user.isAdmin && user.role !== 'admin') {
        hasAccess = false;
      }
    }

    // Log route access check
    logActivity(user._id.toString(), 'ROUTE_ACCESS_CHECK', new Date(), {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      details: { 
        route,
        hasAccess,
        userRole: user.role || 'user',
        isAdmin: user.isAdmin || false
      }
    });

    res.json({
      success: true,
      data: {
        route,
        hasAccess,
        user: {
          id: user._id,
          role: user.role || 'user',
          isAdmin: user.isAdmin || false
        },
        requiredRole
      }
    });

  } catch (error) {
    console.error('Check route access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check route access',
      error: error.message,
      hasAccess: false
    });
  }
};

// Export all controller functions  
module.exports = {
  verifyToken: exports.verifyToken,
  getProfile: exports.getProfile,
  updateProfile: exports.updateProfile,
  getAdminDashboard: exports.getAdminDashboard,
  getAllUsers: exports.getAllUsers,
  checkRouteAccess
};