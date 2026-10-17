const path = require('path');
const fs = require('fs');
const winston = require('winston');

const logDirectory = path.join(__dirname, '../../logs');

fs.mkdirSync(logDirectory, { recursive: true });

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDirectory, 'app.log'),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 3
        })
    ]
});

module.exports = logger;