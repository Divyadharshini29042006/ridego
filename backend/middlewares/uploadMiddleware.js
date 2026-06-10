// backend/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const managerStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/managers';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `manager-${Date.now()}${ext}`);
  },
});

export const uploadManagerImage = multer({ storage: managerStorage });