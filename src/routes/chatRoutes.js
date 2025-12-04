const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Aplicar autenticación a todas las rutas de chat
router.use(verifyToken);

// GET /api/chat/:bookingId - Obtener mensajes de una reserva
router.get('/:bookingId', chatController.getMessages);

// POST /api/chat - Enviar mensaje
router.post('/', chatController.sendMessage);

module.exports = router;
