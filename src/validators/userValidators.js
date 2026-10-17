const { body } = require('express-validator');

const signupValidation = [
  body('username')
    .isString()
    .withMessage('Username must be text')
    .bail()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must contain 3–50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may contain only letters, numbers, and underscores'),

  body('email')
    .isString()
    .withMessage('Email must be text')
    .bail()
    .trim()
    .isLength({ max: 254 })
    .withMessage('Email is too long')
    .isEmail()
    .withMessage('Enter a valid email address')
    .toLowerCase(),

  body('password')
    .isString()
    .withMessage('Password must be text')
    .bail()
    .isLength({ min: 8 })
    .withMessage('Password must contain at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number')
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must not exceed 72 UTF-8 bytes')
];
const loginValidation = [
  body('username')
      .optional()
      .isString()
      .withMessage('Username must be text')
      .bail()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must contain 3–50 characters'),

  body('email')
      .optional()
      .isString()
      .withMessage('Email must be text')
      .bail()
      .trim()
      .isLength({ max: 254 })
      .withMessage('Email is too long')
      .isEmail()
      .withMessage('Enter a valid email address')
      .toLowerCase(),

  body('password')
      .isString()
      .withMessage('Password must be text')
      .bail()
      .notEmpty()
      .withMessage('Password is required')
      .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
      .withMessage('Password must not exceed 72 UTF-8 bytes'),

  body().custom((value, { req }) => {
    const hasUsername =
        typeof req.body?.username === 'string' &&
        req.body.username.trim().length > 0;

    const hasEmail =
        typeof req.body?.email === 'string' &&
        req.body.email.trim().length > 0;

    if (hasUsername === hasEmail) {
      throw new Error('Provide either username or email, but not both');
    }

    return true;
  })
];

module.exports = { signupValidation, loginValidation };