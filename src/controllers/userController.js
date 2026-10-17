const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { matchedData } = require('express-validator');
const logger = require('../config/logger');
const User = require('../models/User');

async function signup(req, res, next) {
    try {
        const { username, email, password } = matchedData(req);

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });
        logger.info('User registered', {
            userId: user._id.toString()
        });

        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        next(error);
    }
}
async function login(req, res, next) {
    try {
        const { username, email, password } = matchedData(req);

        const filter = username ? { username } : { email };
        logger.info('Login attempted');
        const user = await User.findOne(filter).select('+password');

        const passwordMatches =
            user && await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            logger.warn('Login rejected', {
                reason: 'Invalid credentials'
            });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is missing');
        }

        const token = jwt.sign(
            {},
            process.env.JWT_SECRET,
            {
                subject: user._id.toString(),
                expiresIn: process.env.JWT_EXPIRES_IN || '1h',
                algorithm: 'HS256'
            }
        );
        logger.info('Login successful', {
            userId: user._id.toString()
        });

        return res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { signup, login };