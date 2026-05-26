const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trumpcard/cards',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 560, crop: 'fill' }],
    public_id: (req, file) => {
      const name = file.originalname.split('.')[0].replace(/\s+/g, '-');
      return `card-${name}-${Date.now()}`;
    },
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.test(ext) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpeg, jpg, png, and webp images are allowed'));
    }
  },
});

module.exports = upload;
