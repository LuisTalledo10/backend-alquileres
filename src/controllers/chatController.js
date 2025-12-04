const supabase = require('../config/supabase');

const getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles!sender_id(id, full_name, email)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Unexpected error fetching messages:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { booking_id, content } = req.body || {};
    
    // El middleware verifyToken ya inyectó req.user.id
    const sender_id = req.user.id;

    if (!booking_id || !content) {
      return res.status(400).json({ error: 'booking_id and content are required' });
    }

    // Verificar que el usuario sea parte de la reserva
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('owner_id, walker_id')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.owner_id !== sender_id && booking.walker_id !== sender_id) {
      return res.status(403).json({ error: 'Not authorized to send messages in this booking' });
    }

    const messageData = {
      booking_id,
      sender_id,
      content,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error sending message:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
};
