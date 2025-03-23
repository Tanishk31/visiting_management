const express = require('express');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const { sendVisitRequestEmail, sendRequestStatusEmail } = require('../utils/emailService');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// Create visit request
router.post('/visit-request', upload.single('photo'), async (req, res) => {
    try {
        console.log('Creating visitor request:', req.body);
        const { name, email, contact, purpose, hostName, hostContact, company } = req.body;
        const trimmedHostName = hostName.trim();

        // Find host by name (case insensitive) to get their email
        const host = await User.findOne({
            name: { $regex: new RegExp(`^${trimmedHostName}$`, 'i') },
            role: 'host'
        });
        if (!host) {
            return res.status(404).json({ message: "Host not found" });
        }

        console.log('Found host:', host);
        
        // Create visitor record with normalized host name
        const visitor = await Visitor.create({
            name,
            email,
            contact,
            purpose,
            company,
            hostName: host.name, // Use the exact host name from database
            hostContact,
            checkIn: new Date(),
            photo: req.file?.path,
            status: 'pending'
        });

        // Handle email notification
        let emailSent = false;
        let emailError = null;

        try {
            // Send email to host
            await sendVisitRequestEmail(host.email, {
                name,
                company,
                purpose,
                contact,
                checkIn: new Date(),
                photo: req.file?.path,
                visitId: visitor._id,
                visitorEmail: email,
                hostName
            });
            emailSent = true;
            console.log('Email notification sent to host:', host.email);
        } catch (error) {
            emailError = error.message;
            console.error('Failed to send email notification:', error);
        }

        // Prepare and send response
        const response = {
            success: true,
            data: visitor.getFormattedData(),
            email: {
                sent: emailSent,
                recipient: host.email,
                status: emailSent ? 'Notification sent' : 'Failed to send notification',
                error: emailError
            }
        };

        console.log('Visit request processed:', response);
        res.status(201).json(response);

    } catch (error) {
        console.error("Error creating visitor request:", error);
        res.status(400).json({ 
            success: false,
            message: "Error submitting visitor request. Please try again.",
            error: error.message 
        });
    }
});

// Get requests for a host
router.get('/host-requests', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching requests for host:', req.user.name);
        
        if (!req.user || !req.user.name) {
            console.error('No user or user name found in request');
            return res.status(400).json({ message: "User information not found" });
        }

        // Escape special characters in the name for regex
        const escapedName = req.user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const query = {
            hostName: { $regex: new RegExp(`^${escapedName}$`, 'i') }
        };
        console.log('Query:', query);
        
        const visits = await Visitor.find(query).sort({ checkIn: -1 });
        console.log('Found visits:', visits.length);
        
        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: "Error fetching host requests", error: error.message });
    }
});

// Get active visits
router.get('/active-visits', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching active visits for host:', req.user.name);
        
        if (!req.user || !req.user.name) {
            console.error('No user or user name found in request');
            return res.status(400).json({ message: "User information not found" });
        }

        // Escape special characters in the name for regex
        const escapedName = req.user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const query = {
            hostName: { $regex: new RegExp(`^${escapedName}$`, 'i') },
            status: { $in: ['pending', 'approved'] },
            checkOut: null
        };
        
        console.log('Active visits query:', query);
        const visits = await Visitor.find(query).sort({ checkIn: -1 });
        console.log('Found active visits:', visits.length);
        
        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: "Error fetching active visits", error: error.message });
    }
});

// Approve/deny visit
router.put('/approve-visit/:visitId', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const visit = await Visitor.findById(req.params.visitId);
        
        if (!visit) {
            return res.status(404).json({ message: "Visit not found" });
        }
        
        // Only allow status changes by the assigned host (case-insensitive comparison)
        if (visit.hostName.toLowerCase() !== req.user.name.toLowerCase()) {
            return res.status(403).json({ message: "Unauthorized to modify this visit" });
        }
        
        visit.status = status;
        await visit.save();
        
        // Send email notification to visitor
        try {
            await sendRequestStatusEmail(visit.email, {
                status,
                hostName: visit.hostName,
                visitId: visit._id
            });
        } catch (error) {
            console.error('Failed to send status update email:', error);
        }
        
        res.json(visit);
    } catch (error) {
        res.status(500).json({ message: "Error updating visit status", error: error.message });
    }
});

// Checkout visitor
router.put('/checkout/:visitId', authMiddleware, async (req, res) => {
    try {
        const visit = await Visitor.findById(req.params.visitId);
        
        if (!visit) {
            return res.status(404).json({ message: "Visit not found" });
        }
        
        // Only allow checkout by the assigned host (case-insensitive comparison)
        if (visit.hostName.toLowerCase() !== req.user.name.toLowerCase()) {
            return res.status(403).json({ message: "Unauthorized to checkout this visitor" });
        }
        
        visit.checkOut = new Date();
        visit.status = 'checked-out';
        await visit.save();
        
        res.json(visit);
    } catch (error) {
        res.status(500).json({ message: "Error checking out visitor", error: error.message });
    }
});

// Get visits for a visitor
router.get('/my-visits', authMiddleware, async (req, res) => {
    try {
        const visits = await Visitor.find({ email: req.user.email })
            .sort({ checkIn: -1 });
        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: "Error fetching visitor's visits", error: error.message });
    }
});

module.exports = router;
