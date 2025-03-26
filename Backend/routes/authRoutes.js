const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request:', req.body);
        const { name, email, password, role, department, contactNumber } = req.body;

        // Check if role is valid
        if (!['host', 'visitor'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role selected' });
        }

        // Validate department for hosts
        if (role === 'host' && !department) {
            return res.status(400).json({ message: 'Department is required for hosts' });
        }

        // Create user with logging
        console.log('Creating new user:', {
            name,
            email,
            role,
            department: department || 'N/A',
            contactNumber
        });

        const user = new User({
            name,
            email,
            password, // Will be hashed by pre-save middleware
            role,
            department,
            contactNumber
        });

        // Save user with error handling
        try {
            await user.save();
            console.log('User created successfully:', user.email);
        } catch (saveError) {
            console.error('Error saving user:', saveError);
            throw saveError;
        }

        // Generate JWT token with user role and other necessary info
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set token in authorization header
        res.header('Authorization', `Bearer ${token}`);

        // Return user data without sensitive information
        const userData = user.getPublicProfile();
        console.log('Registration successful:', userData);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: userData
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(400).json({
                message: 'Email address is already registered'
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: messages.join('. ')
            });
        }

        // Handle other errors
        res.status(500).json({
            message: 'Error during registration. Please try again.'
        });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt for:', req.body.email);
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is active
        if (user.status === 'inactive') {
            return res.status(401).json({ message: 'Account is inactive. Please contact admin.' });
        }

        // Verify password with detailed logging
        console.log('Attempting password verification for:', email);
        const isValid = await user.comparePassword(password);
        console.log('Password verification result:', isValid);
        
        if (!isValid) {
            console.log('Password verification failed for user:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token with user role
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set token in authorization header
        res.header('Authorization', `Bearer ${token}`);

        const userData = user.getPublicProfile();
        console.log('Login successful:', userData);

        res.json({
            message: 'Login successful',
            token,
            user: userData
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Error during login',
            error: error.message
        });
    }
});

// Get active hosts
router.get('/hosts', async (req, res) => {
    try {
        const hosts = await User.findActiveHosts();
        res.json(hosts);
    } catch (error) {
        console.error('Error fetching hosts:', error);
        res.status(500).json({
            message: 'Error fetching hosts list',
            error: error.message
        });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.getPublicProfile());
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            message: 'Error fetching user data',
            error: error.message
        });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, department, contactNumber } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (department && user.role === 'host') user.department = department;
        if (contactNumber) user.contactNumber = contactNumber;

        await user.save();
        res.json(user.getPublicProfile());
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            message: 'Error updating profile',
            error: error.message
        });
    }
});

module.exports = router;
