const supabase = require('../config/supabase');

const createBooking = async (req, res) => {
  try {
    const { walker_id, pet_id, start_time, duration_hours } = req.body || {};
    
    // El middleware verifyToken ya inyectó req.user.id
    const owner_id = req.user.id;

    if (!walker_id || !pet_id || !start_time || !duration_hours) {
      return res.status(400).json({ 
        error: 'walker_id, pet_id, start_time, and duration_hours are required' 
      });
    }

    // Obtener tarifa del paseador
    const { data: walker, error: walkerError } = await supabase
      .from('walkers_profiles')
      .select('hourly_rate')
      .eq('id', walker_id)
      .single();

    if (walkerError || !walker) {
      console.error('Error fetching walker:', walkerError);
      return res.status(404).json({ error: 'Walker not found' });
    }

    const hourlyRate = walker.hourly_rate || 0;
    const totalPrice = hourlyRate * duration_hours;

    const bookingData = {
      owner_id,
      walker_id,
      pet_id,
      start_time,
      duration_hours,
      total_price: totalPrice,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error creating booking:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getWalkerRequests = async (req, res) => {
  try {
    // El middleware verifyToken ya inyectó req.user.id
    const walker_id = req.user.id;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        owner:user_profiles!owner_id(id, full_name, email, phone),
        pet:pets(id, name, breed, age, notes)
      `)
      .eq('walker_id', walker_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching walker requests:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Unexpected error fetching walker requests:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getOwnerBookings = async (req, res) => {
  try {
    // El middleware verifyToken ya inyectó req.user.id
    const owner_id = req.user.id;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        walker:walker_id ( full_name, email, phone, bio ),
        pet:pet_id ( name, breed, age, notes )
      `)
      .eq('owner_id', owner_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner bookings:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Unexpected error fetching owner bookings:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    
    // El middleware verifyToken ya inyectó req.user.id
    const user_id = req.user.id;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Valid values: ${validStatuses.join(', ')}` 
      });
    }

    // Verificar que el usuario sea parte de la reserva (owner o walker)
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('owner_id, walker_id')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      console.error('Error fetching booking:', fetchError);
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.owner_id !== user_id && booking.walker_id !== user_id) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json(data);
  } catch (err) {
    console.error('Unexpected error updating booking:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createBooking,
  getWalkerRequests,
  getOwnerBookings,
  updateStatus,
};
