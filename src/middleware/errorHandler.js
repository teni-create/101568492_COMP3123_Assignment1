const logger = require('../config/logger');
function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    logger.log({
        level:
            error.code === 11000 ||
            ['ValidationError', 'CastError'].includes(error.name) ||
            ['entity.parse.failed', 'entity.too.large'].includes(error.type)
                ? 'warn'
                : 'error',
        message: 'Request error',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        errorType: error.type || error.name || 'Error'
    });

    if (error.code === 11000) {
        return res.status(409).json({
            status: 'error',
            message: 'Username or email already exists'
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid data'
        });
    }

    if (error.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid field value or ID'
        });
    }

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            status: 'error',
            message: 'Request body must contain valid JSON'
        });
    }

    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            status: 'error',
            message: 'Request body is too large'
        });
    }

    return res.status(500).json({
        status: 'error',
        message: 'An unexpected server error occurred'
    });
}

module.exports = errorHandler;