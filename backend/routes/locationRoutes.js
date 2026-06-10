// backend/routes/locationRoutes.js

import express from 'express';
import { createLocation , getAllLocations, deleteLocation, updateLocation } from '../controllers/locationController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/create', verifyToken, verifyAdmin, createLocation);
router.get('/', verifyToken, verifyAdmin, getAllLocations);
router.put('/:id', verifyToken, verifyAdmin, updateLocation);
router.delete('/:id', verifyToken, verifyAdmin, deleteLocation);

// Public route for getting locations (for homepage dropdown)
router.get('/public', getAllLocations);

// Route for managers to get locations by city (for subLocation dropdown)
router.get('/by-city', verifyToken, getAllLocations);

export default router;
