// backend/controllers/avatarController.js
const sharp = require('sharp');
const { cloudinary } = require('../config/cloudinary');
const User = require('../models/User');
const path = require('path');

/**
 * Upload avatar cho user
 * POST /api/users/avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    console.log('📤 Starting avatar upload for user:', userId);
    console.log('📁 File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Step 1: Resize ảnh với Sharp
    console.log('🔧 Resizing image...');
    const resizedImageBuffer = await sharp(file.buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer();

    console.log('✅ Image resized successfully');

    // Step 2: Upload lên Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    
    // Tạo unique public_id cho ảnh
    const publicId = `avatars/user_${userId}_${Date.now()}`;
    
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: publicId,
          folder: 'user_avatars',
          transformation: [
            { width: 300, height: 300, crop: 'fill' },
            { quality: 'auto:good' },
            { format: 'jpg' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', {
              public_id: result.public_id,
              secure_url: result.secure_url
            });
            resolve(result);
          }
        }
      ).end(resizedImageBuffer);
    });

    // Step 3: Xóa ảnh cũ trên Cloudinary (nếu có)
    const user = await User.findById(userId);
    if (user.avatarCloudinaryId) {
      try {
        console.log('🗑️ Deleting old avatar:', user.avatarCloudinaryId);
        await cloudinary.uploader.destroy(user.avatarCloudinaryId);
        console.log('✅ Old avatar deleted successfully');
      } catch (deleteError) {
        console.warn('⚠️ Could not delete old avatar:', deleteError.message);
        // Không block quá trình upload mới
      }
    }

    // Step 4: Cập nhật thông tin user trong database
    console.log('💾 Updating user avatar info...');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: uploadResult.secure_url,
        avatarCloudinaryId: uploadResult.public_id,
        avatarData: null, // Xóa dữ liệu avatar cũ lưu trong DB
        avatarMime: null
      },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken');

    console.log('✅ Avatar upload completed successfully');

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        user: updatedUser,
        avatarUrl: uploadResult.secure_url,
        avatarId: uploadResult.public_id
      }
    });

  } catch (error) {
    console.error('❌ Avatar upload failed:', error);

    res.status(500).json({
      success: false,
      message: 'Upload avatar failed',
      error: error.message
    });
  }
};

/**
 * Lấy avatar URL của user
 * GET /api/users/:id/avatar
 */
const getAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Getting avatar for user:', id);

    const user = await User.findById(id).select('avatar avatarData avatarMime name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Nếu có avatar URL từ Cloudinary
    if (user.avatar) {
      console.log('✅ Found Cloudinary avatar:', user.avatar);
      return res.json({
        success: true,
        message: 'Avatar retrieved successfully',
        data: {
          avatarUrl: user.avatar,
          source: 'cloudinary'
        }
      });
    }

    // Nếu có avatar data trong database (legacy)
    if (user.avatarData && user.avatarMime) {
      console.log('✅ Found database avatar');
      const base64Avatar = `data:${user.avatarMime};base64,${user.avatarData.toString('base64')}`;
      return res.json({
        success: true,
        message: 'Avatar retrieved successfully',
        data: {
          avatarUrl: base64Avatar,
          source: 'database'
        }
      });
    }

    // Không có avatar
    console.log('ℹ️ No avatar found for user');
    return res.json({
      success: true,
      message: 'No avatar found',
      data: {
        avatarUrl: null,
        source: null
      }
    });

  } catch (error) {
    console.error('❌ Get avatar failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get avatar',
      error: error.message
    });
  }
};

/**
 * Xóa avatar của user
 * DELETE /api/users/avatar
 */
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('🗑️ Deleting avatar for user:', userId);

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Xóa ảnh trên Cloudinary nếu có
    if (user.avatarCloudinaryId) {
      try {
        console.log('☁️ Deleting from Cloudinary:', user.avatarCloudinaryId);
        await cloudinary.uploader.destroy(user.avatarCloudinaryId);
        console.log('✅ Cloudinary deletion successful');
      } catch (deleteError) {
        console.warn('⚠️ Cloudinary deletion warning:', deleteError.message);
        // Vẫn tiếp tục xóa trong database
      }
    }

    // Xóa thông tin avatar trong database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: null,
        avatarCloudinaryId: null,
        avatarData: null,
        avatarMime: null
      },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken');

    console.log('✅ Avatar deleted successfully');

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('❌ Delete avatar failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete avatar',
      error: error.message
    });
  }
};

module.exports = {
  uploadAvatar,
  getAvatar,
  deleteAvatar
};