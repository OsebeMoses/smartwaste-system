const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require('./config/db');
connectDB();

const app = express();

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
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard-user.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-user.html'));
});

app.get('/dashboard-collector.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-collector.html'));
});

app.get('/dashboard-admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-admin.html'));
});

// ===== API 404 HANDLER (FIXED VERSION) =====
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found',
            attemptedPath: req.originalUrl
        });
    }
    next();
});

// ===== FRONTEND CATCH-ALL =====
app.get('/:page', (req, res, next) => {
    // List of known frontend routes
    const knownRoutes = [
        '/',
        '/dashboard-user.html',
        '/dashboard-collector.html',
        '/dashboard-admin.html'
    ];
    
    // If this is a known API route, skip
    if (req.originalUrl.startsWith('/api/')) {
        return next();
    }
    
    // If this is a known frontend route, skip
    if (knownRoutes.includes(req.originalUrl)) {
        return next();
    }
    
    // Otherwise, serve the main page for SPA routing
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== ERROR HANDLING =====
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
    
    // Default error
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🚀 SmartWaste Server Started              ║
╠══════════════════════════════════════════════════════════════╣
║  📍 Local:    http://localhost:${PORT}                       ║
║  🌐 Network:  http://127.0.0.1:${PORT}                       ║
║  🏷️  Port:    ${PORT}                                        ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}    ║
║  ⏰ Started:  ${new Date().toLocaleString()}                 ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});