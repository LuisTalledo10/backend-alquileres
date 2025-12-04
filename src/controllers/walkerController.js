const supabase = require('../config/supabase');

const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { bio, hourly_rate, is_available, latitude, longitude } = req.body || {};

    // Validar que el usuario autenticado coincida con el ID (seguridad básica)
    // En producción, verificar con el token JWT

    const profileData = {
      id, // user_id del walker (FK a user_profiles)
      bio: bio || null,
      hourly_rate: hourly_rate || null,
      is_available: is_available !== undefined ? is_available : true,
      latitude: latitude || null,
      longitude: longitude || null,
    };

    // Upsert: inserta si no existe, actualiza si existe
    const { data, error } = await supabase
      .from('walkers_profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating walker profile:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json(data);
  } catch (err) {
    console.error('Unexpected error updating walker profile:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getNearbyWalkers = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query params are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid lat or lng values' });
    }

    // Llamar a la función RPC de Supabase que calcula distancias geográficas
    const { data, error } = await supabase.rpc('get_nearby_walkers', {
      lat: latitude,
      long: longitude,
      max_dist_km: 10,
    });

    if (error) {
      console.error('Error calling get_nearby_walkers RPC:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Unexpected error getting nearby walkers:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  updateProfile,
  getNearbyWalkers,
};
