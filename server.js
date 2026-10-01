const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require('./config/db');

async function start() {
    try {
        await connectDB();

        const app = express();

        // Create HTTP server FIRST
        const server = http.createServer(app);

        // Initialize Socket.io
        const initializeSocket = require('./config/socket');
        const socketManager = initializeSocket(server);

        // ===== BASIC MIDDLEWARE =====
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true }));
        app.use(cors());

        // ===== STATIC FILES =====
        app.use(express.static(path.join(__dirname, 'public')));

        // ===== API ROUTES =====
        app.use('/api/auth', require('./routes/auth'));
        app.use('/api/pickups', require('./routes/pickups'));
        app.use('/api/collectors', require('./routes/collectors'));
        app.use('/api/rewards', require('./routes/rewards'));
        app.use('/api/analytics', require('./routes/analytics'));
		// Smart routing (feature-flagged inside the router)
		try {
			app.use('/api/routes', require('./routes/routes'));
		} catch (error) {
			console.log('Routes generator not loaded (file might not exist yet)');
		}

        // Add admin routes if the file exists
        try {
            app.use('/api/admin', require('./routes/admin'));
        } catch (error) {
            console.log('Admin routes not loaded (file might not exist yet)');
        }

        // ===== HEALTH CHECK =====
        app.get('/api/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // ===== FRONTEND ROUTES =====
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'login.html'));
        });

        app.get('/resident-login', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'login.html'));
        });

        app.get('/collector-login', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'collector-login.html'));
        });

        app.get('/admin-login', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
        });

        app.get('/register', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'register.html'));
        });

        // Serve dashboard files if they exist
        app.get('/dashboard-user.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard-user.html'));
        });

        app.get('/dashboard-collector.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard-collector.html'));
        });

        app.get('/dashboard-admin.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard-admin.html'));
        });

        app.get('/admin-login.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
        });

        app.get('/collector-login.html', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'collector-login.html'));
        });

        // ===== API 404 HANDLER =====
        // Middleware to catch undefined API routes
        app.use((req, res, next) => {
            if (req.originalUrl.startsWith('/api/')) {
                // List of valid API route prefixes
                const validApiRoutes = [
                    '/api/auth',
                    '/api/pickups',
                    '/api/collectors', 
                    '/api/rewards',
					'/api/analytics',
					'/api/routes',
                    '/api/admin',
                    '/api/health'
                ];
                
                const isValidRoute = validApiRoutes.some(route => 
                    req.originalUrl.startsWith(route)
                );
                
                if (!isValidRoute) {
                    return res.status(404).json({
                        success: false,
                        message: 'API endpoint not found',
                        attemptedPath: req.originalUrl
                    });
                }
            }
            next();
        });

        // ===== ERROR HANDLING MIDDLEWARE =====
        // Must be before catch-all handler but after all routes
        app.use((error, req, res, next) => {
            console.error('Error:', error);
            
            // Mongoose validation error
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    errors: messages
                });
            }
            
            // Mongoose duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Duplicate field value entered'
                });
            }
            
            // JWT error
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
            
            // Token expired error
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.'
                });
            }
            
            // Default error
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        });

        // ===== CATCH-ALL HANDLER =====
        // This must be the last route
        app.use((req, res) => {
            // If it's an API route that got here, it's not found
            if (req.originalUrl.startsWith('/api/')) {
                return res.status(404).json({
                    success: false,
                    message: 'API endpoint not found',
                    attemptedPath: req.originalUrl
                });
            }
            
            // For all other routes (frontend), serve login page
            // This handles SPA routing - any unknown frontend route goes to login
            res.sendFile(path.join(__dirname, 'public', 'login.html'));
        });

        // ===== START SERVER WITH PORT RETRY =====
        const BASE_PORT = parseInt(process.env.PORT || '5000', 10);
        let currentPort = BASE_PORT;
        let attempts = 0;
        const maxAttempts = 5;

        const startListening = () => {
            server.listen(currentPort, () => {
                console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🚀 SmartWaste Server Started              ║
╠══════════════════════════════════════════════════════════════╣
║  📍 Local:    http://localhost:${currentPort}                ║
║  🌐 Network:  http://127.0.0.1:${currentPort}                ║
║  🏷️  Port:    ${currentPort}                                   ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}    ║
║  ⏰ Started:  ${new Date().toLocaleString()}                 ║
╚══════════════════════════════════════════════════════════════╝
                `);
            });
        };

        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE' && attempts < maxAttempts) {
                const nextPort = currentPort + 1;
                console.warn(`Port ${currentPort} is in use. Retrying on port ${nextPort}...`);
                attempts += 1;
                currentPort = nextPort;
                setTimeout(startListening, 500);
            } else {
                console.error('Failed to start server:', err);
                process.exit(1);
            }
        });

        startListening();

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down gracefully...');
            process.exit(0);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start();