function validateSignup(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password || !email.includes('@') || password.length < 6) {
    return res.status(400).json({ error: 'Invalid email or password (minimum 6 characters)' });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  next();
}

module.exports = { validateSignup, validateLogin };