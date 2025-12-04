const supabase = require('../config/supabase');

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Autenticar con Supabase Auth (Sistema de Seguridad)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      console.error('Auth signIn error:', error || data);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const userId = data.user.id;

    // 2. Obtener perfil de la Base de Datos
    // CAMBIO CLAVE: Usamos .maybeSingle() para evitar el error 500 si no hay perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role,full_name,tenant_id')
      .eq('id', userId)
      .maybeSingle(); 

    // Si hubo un error técnico en la base de datos
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(500).json({ error: 'Error al cargar el perfil del usuario' });
    }

    // Si el usuario entró, pero NO TIENE PERFIL en la tabla
    if (!profile) {
      return res.status(404).json({ error: 'Usuario autenticado, pero no tiene perfil asignado en la base de datos.' });
    }

    // 3. Todo correcto: Devolvemos Token + Datos del Usuario + ROL
    return res.json({
      token: data.session?.access_token || null,
      user: {
        id: userId,
        email: data.user.email,
        full_name: profile.full_name,
        role: profile.role,        // ¡Vital para el Frontend!
        tenant_id: profile.tenant_id,
      },
    });

  } catch (err) {
    console.error('Unexpected error in login:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  login,
};