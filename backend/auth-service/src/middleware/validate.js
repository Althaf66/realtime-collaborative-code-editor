const Joi = require('joi');

function validateSignup(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required().messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name must be at most 30 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    logger.warn(`Signup validation error: ${error.details[0].message}`);
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
}

function validateLogin(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    logger.warn(`Login validation error: ${error.details[0].message}`);
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
}

module.exports = { validateSignup, validateLogin };