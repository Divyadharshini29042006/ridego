import express from 'express';
import {
  createDriver,
  getDriversByManager,
  updateDriver,
  deleteDriver,
  getDriversByLocation,
  getDriversWithFilters,
  updateDriverStatus
} from '../controllers/driverController.js';

import { verifyToken, verifyManager } from '../middlewares/authMiddleware.js';
import { uploadDriverImage } from '../middlewares/uploadMiddlewareDriver.js';
const router = express.Router();

router.post(
  '/create',
  verifyToken,
  verifyManager,
  uploadDriverImage.fields([
    { name: 'image', maxCount: 1 },
    { name: 'licenseFile', maxCount: 1 }
  ]),
  createDriver
);

router.get('/my', verifyToken, verifyManager, getDriversByManager);

router.get('/location/:city', verifyToken, getDriversByLocation);

router.put(
  '/:id',
  verifyToken,
  verifyManager,
  uploadDriverImage.fields([
    { name: 'image', maxCount: 1 },
    { name: 'licenseFile', maxCount: 1 }
  ]),
  updateDriver
);

router.delete('/:id', verifyToken, verifyManager, deleteDriver);

router.get('/', getDriversWithFilters);

router.put('/:id/status', updateDriverStatus);

export default router;
