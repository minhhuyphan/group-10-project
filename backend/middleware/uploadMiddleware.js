// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Cấu hình Multer để xử lý file upload
const storage = multer.memoryStorage(); // Lưu file trong memory để xử lý với Sharp

// File filter để chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  // Kiểm tra MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (JPEG, PNG, GIF, WebP)'), false);
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
    files: 1 // Chỉ cho phép upload 1 file
  }
});

// Middleware xử lý lỗi upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Vui lòng chọn file nhỏ hơn 5MB',
        error: 'FILE_TOO_LARGE'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được upload một file',
        error: 'TOO_MANY_FILES'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Lỗi upload file',
      error: err.code
    });
  }
  
  if (err.message.includes('Chỉ cho phép upload file ảnh')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  next(err);
};

// Middleware để validate file đã được upload
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng chọn file để upload',
      error: 'NO_FILE_UPLOADED'
    });
  }
  
  // Kiểm tra thêm về file buffer
  if (!req.file.buffer || req.file.buffer.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'File upload bị lỗi hoặc rỗng',
      error: 'INVALID_FILE_BUFFER'
    });
  }
  
  next();
};

module.exports = {
  upload,
  handleUploadError,
  validateFileUpload
};