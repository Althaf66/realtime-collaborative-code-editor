const express = require('express');
const cors = require('cors');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const { logger } = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.url}`); // Log all requests
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Auth Service running on port ${PORT}`);
});