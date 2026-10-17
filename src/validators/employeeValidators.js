const { body, param, query } = require('express-validator');

const employeeValidation = [
    ...['first_name', 'last_name', 'position', 'department'].map((field) =>
        body(field)
            .isString()
            .withMessage(`${field} must be text`)
            .bail()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage(`${field} must contain 1–100 characters`)
    ),

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

    body('salary')
        .custom((value) =>
            typeof value === 'number' &&
            Number.isFinite(value) &&
            value >= 0.01
        )
        .withMessage('Salary must be a number of at least 0.01'),

    body('date_of_joining')
        .isString()
        .withMessage('Date of joining must be text')
        .bail()
        .isISO8601({ strict: true })
        .withMessage('Enter a valid ISO date, such as 2026-10-16'),

    body('user')
        .not()
        .exists()
        .withMessage('Employee ownership cannot be supplied or changed')
];

const employeeIdValidation = [
    param('eid')
        .isMongoId()
        .withMessage('Employee ID must be a valid MongoDB ObjectId')
];

const deleteEmployeeValidation = [
    query('eid')
        .isMongoId()
        .withMessage('Employee ID must be a valid MongoDB ObjectId')
];

module.exports = {
    employeeValidation,
    employeeIdValidation,
    deleteEmployeeValidation
};


