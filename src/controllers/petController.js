const supabase = require('../config/supabase');

const createPet = async (req, res) => {
  try {
    const { name, breed, age, notes } = req.body || {};
    
    // El middleware verifyToken ya inyectó req.user.id
    const owner_id = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Pet name is required' });
    }

    const petData = {
      owner_id,
      name,
      breed: breed || null,
      age: age || null,
      notes: notes || null,
    };

    const { data, error } = await supabase
      .from('pets')
      .insert([petData])
      .select()
      .single();

    if (error) {
      console.error('Error creating pet:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error creating pet:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyPets = async (req, res) => {
  try {
    // El middleware verifyToken ya inyectó req.user.id
    const owner_id = req.user.id;

    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', owner_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pets:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Unexpected error fetching pets:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createPet,
  getMyPets,
};
