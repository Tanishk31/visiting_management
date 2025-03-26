const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

dotenv.config();
connectDB();

const app = express();

// CORS Configuration
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Set additional security headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Basic request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request body logging
app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length) {
        console.log('Request Body:', req.body);
    }
    next();
});

// Import routes
const visitorRoutes = require('./routes/visitorRoutes');
const authRoutes = require('./routes/authRoutes');

// Mount routes with debug logging
app.use('/api/auth', (req, res, next) => {
    console.log('Auth route accessed:', req.method, req.path);
    next();
}, authRoutes);

// Ensure auth token is present for visitor routes
app.use('/api/visitors', (req, res, next) => {
    console.log('Visitor route accessed:', req.method, req.path);
    const authHeader = req.headers.authorization;
    
    // Debug logging
    console.log('Auth header:', authHeader);
    console.log('Request headers:', req.headers);
    
    next();
}, visitorRoutes);

// Debug endpoint to list all registered routes
app.get('/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    let path = handler.route.path;
                    if (middleware.regexp.test('/api/visitors')) {
                        path = '/api/visitors' + path;
                    } else if (middleware.regexp.test('/api/auth')) {
                        path = '/api/auth' + path;
                    }
                    routes.push({
                        path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json(routes);
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
});
// Ensure uploads directory exists
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes:', app._router.stack
        .filter(r => r.route)
        .map(r => ({
            path: r.route.path,
            methods: Object.keys(r.route.methods)
        }))
    );
}).on('error', (error) => {
    console.error('Server error:', error);
});

module.exports = app;
