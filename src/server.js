require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const errorHandler = require('./middleware/errorHandler');
const connectDatabase = require('./config/database');
const express = require('express');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(requestLogger);
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'API is running'
    });
});
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

app.use(errorHandler);

async function startServer() {
    try {
        await connectDatabase();

        logger.info('Database connected');

        app.listen(PORT, () => {
            logger.info('Server started', { port: PORT });
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error('Server startup failed', {
            errorType: error.name
        });

        console.error(
            'Startup failed. Check your database configuration and Atlas access.'
        );

        process.exitCode = 1;
    }
}

startServer();