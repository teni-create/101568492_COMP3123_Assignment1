const { authLimiter } = require('../middleware/rateLimiters');
const express = require('express');
const { signup, login } = require('../controllers/userController');
const {
    signupValidation,
    loginValidation
} = require('../validators/userValidators');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
    '/signup',
    authLimiter,
    signupValidation,
    validateRequest,
    signup
);

router.post(
    '/login',
    authLimiter,
    loginValidation,
    validateRequest,
    login
);

module.exports = router;