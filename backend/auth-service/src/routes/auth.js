const express = require('express');
const { signup, login, getProfile } = require('../controllers/auth');
const { validateSignup, validateLogin } = require('../middleware/validate');
const verifyToken = require('../middleware/jwt');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/profile', verifyToken, getProfile);

module.exports = router;