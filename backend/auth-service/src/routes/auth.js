const express = require('express');
const passport = require('passport');
const { signup, login, getProfile, googleCallback } = require('../controllers/auth');
const { validateSignup, validateLogin } = require('../middleware/validate');
const verifyToken = require('../middleware/jwt');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/profile', verifyToken, getProfile);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

module.exports = router;