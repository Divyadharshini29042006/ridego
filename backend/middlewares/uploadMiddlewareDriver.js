import multer from 'multer';
import path from 'path';
import fs from 'fs';

const driverStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/drivers';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `driver-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile image'), false);
    }
  } else if (file.fieldname === 'licenseFile') {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image or PDF files are allowed for license document'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

export const uploadDriverImage = multer({ 
  storage: driverStorage,
  fileFilter: fileFilter
});
