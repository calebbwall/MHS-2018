require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// -------------------------------------------------------
// Middleware
// -------------------------------------------------------
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// -------------------------------------------------------
// API Routes
// -------------------------------------------------------
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/events',   require('./routes/events'));
app.use('/api/rsvps',    require('./routes/rsvps'));
app.use('/api/admin',    require('./routes/admin'));

// -------------------------------------------------------
// Serve React client in production
// -------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// -------------------------------------------------------
// Global error handler
// -------------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
