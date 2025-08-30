const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('JWT verification failed: No token provided or invalid format');
    return res.status(401).json({ error: 'No token provided or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    logger.info(`JWT verified for userId: ${req.userId}`);
    next();
  } catch (error) {
    logger.warn(`JWT verification error: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = verifyToken;