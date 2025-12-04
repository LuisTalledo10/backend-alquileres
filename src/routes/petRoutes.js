const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
// IMPORTANTE: Fíjate que tenga las llaves { } al importar
const { verifyToken } = require('../middlewares/authMiddleware'); 

// Aplica el portero de seguridad a TODAS las rutas de abajo
router.use(verifyToken);

// Rutas
router.post('/', petController.createPet);
router.get('/', petController.getMyPets);

module.exports = router;