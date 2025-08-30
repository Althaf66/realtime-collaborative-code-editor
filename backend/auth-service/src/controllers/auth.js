const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const redis = require('redis');
const { logger } = require('../utils/logger'); // New: Winston logger

const prisma = new PrismaClient();
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(err => logger.error('Redis connection error:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

async function signup(req, res) {
  const { name, email, password } = req.body;

  try {
    logger.info(`Signup attempt for email: ${email}`);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn(`Signup failed: Email already registered: ${email}`);
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await redisClient.setEx(`refresh_token:${user.id}`, REFRESH_TOKEN_EXPIRY, refreshToken);
    logger.info(`User signed up successfully: ${user.id}`);

    res.status(201).json({ accessToken, refreshToken, userId: user.id });
  } catch (error) {
    logger.error(`Signup error for ${email}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    logger.info(`Login attempt for email: ${email}`);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      logger.warn(`Login failed: Invalid credentials for ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      logger.warn(`Login failed: Incorrect password for ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await redisClient.setEx(`refresh_token:${user.id}`, REFRESH_TOKEN_EXPIRY, refreshToken);
    logger.info(`User logged in successfully: ${user.id}`);

    res.status(200).json({ accessToken, refreshToken, userId: user.id });
  } catch (error) {
    logger.error(`Login error for ${email}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getProfile(req, res) {
  try {
    logger.info(`Profile request for userId: ${req.userId}`);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      logger.warn(`Profile not found for userId: ${req.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ email: user.email, id: user.id });
  } catch (error) {
    logger.error(`Profile error for userId ${req.userId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function googleCallback(req, res) {
  try {
    const user = req.user;
    logger.info(`Google OAuth callback for userId: ${user.id}, email: ${user.email}`);
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await redisClient.setEx(`refresh_token:${user.id}`, REFRESH_TOKEN_EXPIRY, refreshToken);
    logger.info(`Google OAuth successful for userId: ${user.id}`);

    res.status(200).json({ accessToken, refreshToken, userId: user.id });
  } catch (error) {
    logger.error(`Google OAuth error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { signup, login, getProfile, googleCallback };