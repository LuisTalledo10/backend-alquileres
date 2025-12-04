const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');

// Crear cliente admin usando la Service Role Key (si está disponible)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let adminSupabase = null;
if (supabaseServiceRoleKey && supabaseUrl) {
  adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);
} else {
  // Intentar cargar la service role key directamente desde el archivo .env del proyecto como fallback
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '..', '.env');
    if (fs.existsSync(envPath)) {
      const envRaw = fs.readFileSync(envPath, 'utf8');
      const match = envRaw.split(/\r?\n/).find(l => l.includes('SUPABASE_SERVICE_ROLE_KEY'));
      if (match) {
        const parts = match.split('=');
        const val = parts.slice(1).join('=') || '';
        const trimmed = val.trim();
        if (trimmed) {
          adminSupabase = createClient(supabaseUrl, trimmed);
          console.log('INFO: Loaded SUPABASE_SERVICE_ROLE_KEY from .env (fallback).');
        }
      }
    }
  } catch (e) {
    // ignore and print warning below
  }
  if (!adminSupabase) console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL not set. Admin actions will fail.');
}

const getAll = async (req, res) => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('Unexpected error in getAll users:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const create = async (req, res) => {
  try {
    const { email, password, full_name, role, dni, phone } = req.body || {};

    // Validamos que vengan los datos importantes
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!adminSupabase) {
      console.error('Admin Supabase client not configured. Check SUPABASE_SERVICE_ROLE_KEY.');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // PASO 1 (Admin): Crear usuario en Auth como administrador y confirmar email
    const { data: adminData, error: adminError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (adminError) {
      console.error('Admin createUser error:', adminError);
      return res.status(400).json({ error: adminError.message || adminError });
    }

    const userId = adminData?.user?.id;
    if (!userId) {
      console.error('admin.createUser succeeded but no user id returned', adminData);
      return res.status(500).json({ error: 'Failed to retrieve user id after admin.createUser' });
    }

    // PASO 2: Tenant (marketplace único global)
    const tenant_id = null; // Sin multi-tenancy por ahora

    // PASO 3: Crear perfil en la Base de Datos
    const profilePayload = {
      id: userId,
      email: email,
      full_name: full_name || null,
      role: role || 'owner', // Por defecto: dueño de mascota
      dni: dni || null,
      phone: phone || null,
      tenant_id: tenant_id,
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profilePayload])
      .select()
      .single();

    if (error) {
      console.error('Error inserting user profile:', error);
      // Nota: idealmente eliminar el usuario creado con adminSupabase.auth.admin.deleteUser(userId)
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error creating user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Evitamos que intenten actualizar cosas raras si mandan basura en el body
    delete updates.password; 
    delete updates.id;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('Unexpected error updating user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    // Nota: Al borrar de aquí, el usuario sigue en Auth. 
    // Para un sistema real, deberíamos borrarlo también de supabase.auth.admin.deleteUser(id)
    // Pero eso requiere 'service_role key'. Por ahora esto basta para el dashboard.
    
    const { data, error } = await supabase.from('user_profiles').delete().eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ deleted: data });
  } catch (err) {
    console.error('Unexpected error deleting user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  delete: remove,
};