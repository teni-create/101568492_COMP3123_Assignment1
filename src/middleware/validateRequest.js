const { validationResult } = require('express-validator');
const logger = require('../config/logger');

function validateRequest(req, res, next) {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        logger.warn('Validation failed', {
            method: req.method,
            path: req.path,
            fields: [...new Set(
                result.array().map((error) => error.path || 'body')
            )]
        });

        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: result.array().map((error) => ({
                field: error.path,
                message: error.msg
            }))
        });
    }

    next();
}

module.exports = validateRequest;