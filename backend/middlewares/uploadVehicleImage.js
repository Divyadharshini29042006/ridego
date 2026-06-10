import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const vehicleDir = path.join('uploads', 'vehicles');
if (!fs.existsSync(vehicleDir)) {
  fs.mkdirSync(vehicleDir, { recursive: true });
}

// Storage configuration
const vehicleStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, vehicleDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `vehicle-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// Optional: File type filter (accept only images)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, avif)'));
  }
};

// Exported middleware
export const uploadVehicleImage = multer({
  storage: vehicleStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});