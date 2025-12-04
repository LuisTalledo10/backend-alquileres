const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Aplicar autenticación a todas las rutas de bookings
router.use(verifyToken);

// POST /api/bookings - Crear reserva
router.post('/', bookingController.createBooking);

// GET /api/bookings/walker - Solicitudes para el paseador
router.get('/walker', bookingController.getWalkerRequests);

// GET /api/bookings/owner - Reservas del dueño
router.get('/owner', bookingController.getOwnerBookings);

// PUT /api/bookings/:id - Actualizar estado de reserva
router.put('/:id', bookingController.updateStatus);

module.exports = router;
