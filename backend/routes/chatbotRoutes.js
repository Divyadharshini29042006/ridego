// backend/routes/chatbotRoutes.js
import express from 'express';
import { chatController } from '../controllers/chatbotController.js';
const router = express.Router();
// POST /api/chat - Main chat endpoint
router.post('/', chatController);
// GET /api/chat/test - Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Chatbot route is working!',
    timestamp: new Date().toISOString()
  });
});

export default router;
