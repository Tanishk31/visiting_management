const jwt = require('jsonwebtoken');

const checkRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({
            message: `Access denied. Only ${role}s can perform this action.`
        });
    }
    next();
};

const authMiddleware = (req, res, next) => {
    try {
        console.log('Auth Middleware - Headers:', req.headers);
        
        // Get token from header
        const authHeader = req.header('Authorization');
        console.log('Auth Header:', authHeader);
        
        if (!authHeader) {
            console.log('No Authorization header found');
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        // Extract token from Bearer format
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        console.log('Extracted token:', token ? 'Present' : 'Missing');
        
        if (!token) {
            console.log('No token after Bearer extraction');
            return res.status(401).json({ message: "Invalid token format" });
        }

        // Verify token and decode payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token payload:', {
            userId: decoded.userId,
            role: decoded.role
        });
        
        if (!decoded.userId) {
            console.log('No userId in token payload');
            return res.status(401).json({ message: "Invalid token payload" });
        }

        // Add user info to request
        req.user = {
            _id: decoded.userId,
            role: decoded.role,
            ...decoded
        };
        
        console.log('User attached to request:', {
            _id: req.user._id,
            role: req.user.role
        });
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        }
        res.status(401).json({ message: "Authentication failed" });
    }
};

module.exports = authMiddleware;
