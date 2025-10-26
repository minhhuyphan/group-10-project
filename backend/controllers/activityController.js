// backend/controllers/activityController.js
/**
 * Activity Controller - SV1
 * API endpoints để quản lý và xem activity logs
 */

const fs = require('fs');
const path = require('path');
const { getUserActivities } = require('../middleware/activityLogMiddleware');

// Đường dẫn đến thư mục activity logs
const activityLogsDir = path.join(__dirname, '../logs/activity');

/**
 * Get user activities by userId
 */
exports.getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, action } = req.query;
    
    // Get from memory (latest activities)
    let activities = getUserActivities(userId, parseInt(limit));
    
    // Filter by action if provided
    if (action) {
      activities = activities.filter(activity => activity.action === action);
    }
    
    res.json({
      success: true,
      data: {
        userId,
        totalActivities: activities.length,
        activities
      }
    });
  } catch (error) {
    console.error('Error getting user activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user activities',
      error: error.message
    });
  }
};

/**
 * Get all activities for a specific date
 */
exports.getActivitiesByDate = async (req, res) => {
  try {
    const { date } = req.params; // Format: YYYY-MM-DD
    const { userId, action, limit = 100 } = req.query;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const logFile = path.join(activityLogsDir, `activity-${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      return res.json({
        success: true,
        data: {
          date,
          totalActivities: 0,
          activities: []
        }
      });
    }
    
    // Read and parse log file
    const logContent = fs.readFileSync(logFile, 'utf8');
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    let activities = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    // Apply filters
    if (userId) {
      activities = activities.filter(activity => activity.userId === userId);
    }
    
    if (action) {
      activities = activities.filter(activity => activity.action === action);
    }
    
    // Apply limit
    activities = activities.slice(-parseInt(limit)).reverse();
    
    res.json({
      success: true,
      data: {
        date,
        totalActivities: activities.length,
        activities
      }
    });
    
  } catch (error) {
    console.error('Error getting activities by date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activities',
      error: error.message
    });
  }
};

/**
 * Get activity statistics
 */
exports.getActivityStats = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const logFile = path.join(activityLogsDir, `activity-${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      return res.json({
        success: true,
        data: {
          date,
          totalActivities: 0,
          actionStats: {},
          userStats: {}
        }
      });
    }
    
    const logContent = fs.readFileSync(logFile, 'utf8');
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    const activities = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    // Calculate statistics
    const actionStats = {};
    const userStats = {};
    const hourlyStats = {};
    
    activities.forEach(activity => {
      // Action statistics
      actionStats[activity.action] = (actionStats[activity.action] || 0) + 1;
      
      // User statistics
      userStats[activity.userId] = (userStats[activity.userId] || 0) + 1;
      
      // Hourly statistics
      const hour = new Date(activity.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: {
        date,
        totalActivities: activities.length,
        actionStats,
        userStats,
        hourlyStats,
        topActions: Object.entries(actionStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        topUsers: Object.entries(userStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
      }
    });
    
  } catch (error) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity statistics',
      error: error.message
    });
  }
};

/**
 * Get recent activities (last N activities)
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 50, action, userId } = req.query;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(activityLogsDir, `activity-${today}.log`);
    
    if (!fs.existsSync(logFile)) {
      return res.json({
        success: true,
        data: {
          totalActivities: 0,
          activities: []
        }
      });
    }
    
    const logContent = fs.readFileSync(logFile, 'utf8');
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    let activities = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    // Apply filters
    if (userId) {
      activities = activities.filter(activity => activity.userId === userId);
    }
    
    if (action) {
      activities = activities.filter(activity => activity.action === action);
    }
    
    // Get most recent activities
    activities = activities.slice(-parseInt(limit)).reverse();
    
    res.json({
      success: true,
      data: {
        totalActivities: activities.length,
        activities
      }
    });
    
  } catch (error) {
    console.error('Error getting recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activities',
      error: error.message
    });
  }
};

/**
 * Search activities by pattern
 */
exports.searchActivities = async (req, res) => {
  try {
    const { 
      date = new Date().toISOString().split('T')[0], 
      search, 
      userId, 
      action, 
      limit = 50 
    } = req.query;
    
    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }
    
    const logFile = path.join(activityLogsDir, `activity-${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      return res.json({
        success: true,
        data: {
          searchTerm: search,
          totalResults: 0,
          activities: []
        }
      });
    }
    
    const logContent = fs.readFileSync(logFile, 'utf8');
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    let activities = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    // Apply search filter
    const searchLower = search.toLowerCase();
    activities = activities.filter(activity => {
      const activityStr = JSON.stringify(activity).toLowerCase();
      return activityStr.includes(searchLower);
    });
    
    // Apply additional filters
    if (userId) {
      activities = activities.filter(activity => activity.userId === userId);
    }
    
    if (action) {
      activities = activities.filter(activity => activity.action === action);
    }
    
    // Apply limit
    activities = activities.slice(-parseInt(limit)).reverse();
    
    res.json({
      success: true,
      data: {
        searchTerm: search,
        totalResults: activities.length,
        activities
      }
    });
    
  } catch (error) {
    console.error('Error searching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search activities',
      error: error.message
    });
  }
};