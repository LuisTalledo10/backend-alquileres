// index.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();

// IMPORTANTE: Esto permite que tu frontend en Netlify hable con este backend
app.use(cors());
app.use(express.json());

// 1. Conexión con Supabase (La Base de Datos)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Ruta de Prueba (Para ver si el servidor vive)
app.get('/', (req, res) => {
  res.send('¡El Backend del Sistema de Alquileres está ONLINE! 🚀');
});

// 3. Ruta para consultar una empresa (Prueba de conexión a DB)
app.get('/api/empresa-test', async (req, res) => {
  // Buscamos la empresa que creaste manualmente
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .limit(1);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// 4. Iniciar el Servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});