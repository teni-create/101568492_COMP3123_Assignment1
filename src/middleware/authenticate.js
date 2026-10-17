const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../config/logger');

async function authenticate(req, res, next) {
    const authorization = req.get('Authorization');
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        logger.warn('Authentication rejected', {
            reason: 'Missing or malformed Bearer header',
            method: req.method,
            path: req.originalUrl.split('?')[0]
        });
        return res.status(401).json({
            status: 'error',
            message: 'A Bearer token is required'
        });
    }

    if (!process.env.JWT_SECRET) {
        return next(new Error('JWT_SECRET is missing'));
    }

    try {
        const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });

        if (
            typeof payload !== 'object' ||
            !mongoose.isObjectIdOrHexString(payload.sub)
        ) {
            logger.warn('Authentication rejected', {
                reason: 'Invalid token identity',
                method: req.method,
                path: req.originalUrl.split('?')[0]
            });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid authentication token'
            });
        }

        const user = await User.findById(payload.sub);

        if (!user) {
            logger.warn('Authentication rejected', {
                reason: 'Invalid token identity',
                method: req.method,
                path: req.originalUrl.split('?')[0]
            });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid authentication token'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError'
        ) {
            logger.warn('Authentication rejected', {
                reason: error.name,
                method: req.method,
                path: req.originalUrl.split('?')[0]
            });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired authentication token'
            });
        }

        next(error);
    }
}

module.exports = authenticate;