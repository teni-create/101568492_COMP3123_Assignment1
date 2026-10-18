const path = require('path');
const fs = require('fs');
const winston = require('winston');

const transports = [];

if (process.env.VERCEL === '1') {
    transports.push(new winston.transports.Console());
} else {
    const logDirectory = path.join(__dirname, '../../logs');
    fs.mkdirSync(logDirectory, { recursive: true });
    transports.push(new winston.transports.File({
        filename: path.join(logDirectory, 'app.log'),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 3
    }));
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports
});

module.exports = logger;
