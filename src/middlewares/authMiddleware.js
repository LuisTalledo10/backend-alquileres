const supabase = require('../config/supabase');

const verifyToken = async (req, res, next) => {
  try {
    console.log('1. Middleware invocado');
    
    // Extraer token del header Authorization: "Bearer TOKEN"
    const authHeader = req.headers.authorization;
    console.log('2. Cabecera Auth recibida:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Fallo: No hay cabecera');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('3. Token extraído:', token ? token.substring(0, 10) + '...' : 'VACÍO');

    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.log('4. Consultando a Supabase...');
    
    // Verificar token con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.log('❌ Error Supabase:', error.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (!user) {
      console.log('❌ Usuario es null');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('✅ Éxito! Usuario ID:', user.id);

    // Inyectar datos del usuario en req.user
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (err) {
    console.error('Unexpected error in verifyToken middleware:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  verifyToken,
};
