const express = require('express');
const router = express.Router();
const walkerController = require('../controllers/walkerController');

// POST /api/walkers/profile/:id - Actualizar perfil de paseador
router.post('/profile/:id', walkerController.updateProfile);

// GET /api/walkers/nearby?lat=X&lng=Y - Obtener paseadores cercanos
router.get('/nearby', walkerController.getNearbyWalkers);

module.exports = router;
