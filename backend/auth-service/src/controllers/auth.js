const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const redis = require('redis');

const prisma = new PrismaClient();
const redisClient = redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.connect().catch(console.error);

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// Signup handler
async function signup(req, res) {
  const { name, email, password } = req.body;

  // Basic input validation
  if (!email || !password || !email.includes('@') || password.length < 6) {
    return res.status(400).json({ error: 'Invalid email or password (minimum 6 characters)' });
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate JWT
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Store refresh token in Redis
    await redisClient.setEx(`refresh_token:${user.id}`, REFRESH_TOKEN_EXPIRY, refreshToken);

    res.status(201).json({ accessToken, refreshToken, userId: user.id });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Login handler
async function login(req, res) {
  const { email, password } = req.body;

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Store refresh token in Redis
    await redisClient.setEx(`refresh_token:${user.id}`, REFRESH_TOKEN_EXPIRY, refreshToken);

    res.status(200).json({ accessToken, refreshToken, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ email: user.email, id: user.id });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { signup, login, getProfile };