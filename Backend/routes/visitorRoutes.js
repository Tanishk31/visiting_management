const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const Visitor = require('../models/Visitor');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Helper function to format visit data consistently
const formatVisitResponse = (visit) => ({
    _id: visit._id,
    name: visit.name || (visit.visitor ? visit.visitor.name : 'TBD'),
    email: visit.email || (visit.visitor ? visit.visitor.email : ''),
    contact: visit.contactNumber || (visit.visitor ? visit.visitor.contactNumber : ''),
    company: visit.company || 'N/A',
    purpose: visit.purpose,
    status: visit.status,
    checkIn: visit.checkIn,
    checkOut: visit.checkOut,
    startTime: visit.startTime,
    endTime: visit.endTime,
    photo: visit.photo,
    hostName: visit.host ? visit.host.name : '',
    department: visit.host ? visit.host.department : ''
});

// Get active visits
router.get('/active-visits', authMiddleware, async (req, res) => {
    try {
        // Verify user is a host
        if (req.user.role !== 'host') {
            console.log('Non-host user attempted to access active visits:', req.user);
            return res.status(403).json({
                message: 'Only hosts can access active visits'
            });
        }

        console.log('Fetching active visits for host:', req.user._id);

        let activeVisits = await Visitor.find({
            host: req.user._id,
            status: { $in: ['active', 'approved'] }
        })
        .populate('visitor', 'name email contactNumber')
        .populate('host', 'name department email')
        .sort({ createdAt: -1 })
        .lean();

        // If no visits found, return empty array
        if (!activeVisits) {
            console.log('No active visits found for host:', req.user._id);
            activeVisits = [];
        }

        // Ensure all required fields are present
        activeVisits = activeVisits.filter(visit => {
            const isValid = visit && visit.visitor && visit.host;
            if (!isValid) {
                console.warn('Found invalid visit data:', visit);
            }
            return isValid;
        });

        console.log(`Found ${activeVisits.length} active visits`);

        // Transform data to match frontend expectations
        const formattedVisits = activeVisits.map(formatVisitResponse);
        
        console.log('Response data:', {
            count: formattedVisits.length,
            sample: formattedVisits[0] || 'no visits'
        });
        
        res.json(formattedVisits);
    } catch (error) {
        console.error('Error fetching active visits:', error);
        res.status(500).json({
            message: 'Error fetching active visits',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Validation middleware for visit request
const validateVisitRequest = (req, res, next) => {
    const { name, email, contact, purpose, company, hostId } = req.body;
    const errors = [];

    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    if (!contact) errors.push('Contact number is required');
    if (!purpose) errors.push('Purpose is required');
    if (!company) errors.push('Company is required');
    if (!hostId) errors.push('Host selection is required');
    if (!req.file) errors.push('Photo is required');

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation error',
            errors
        });
    }

    next();
};

// Create visit request
router.post('/visit-request', authMiddleware, upload.single('photo'), validateVisitRequest, async (req, res) => {
    try {
        const { purpose, company, hostId, name, email, contact } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Photo is required' });
        }

        // Create new visit with all required fields
        const newVisit = new Visitor({
            visitor: req.user._id,
            host: hostId,
            name,
            email,
            contactNumber: contact,
            purpose,
            company,
            startTime: new Date(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            status: 'pending',
            photo: 'uploads/' + path.basename(req.file.path)
        });

        await newVisit.save();
        
        // Populate visitor and host details
        await newVisit.populate([
            { path: 'visitor', select: 'name email contactNumber' },
            { path: 'host', select: 'name department' }
        ]);

        console.log('Visit request created:', {
            id: newVisit._id,
            visitor: newVisit.visitor,
            host: newVisit.host,
            photo: newVisit.photo
        });

        res.status(201).json(formatVisitResponse(newVisit));
    } catch (error) {
        console.error('Error creating visit request:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        // Handle other errors
        res.status(500).json({
            message: 'Error creating visit request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get host's pending requests
router.get('/host-requests', authMiddleware, async (req, res) => {
    try {
        const requests = await Visitor.find({
            host: req.user._id,
            status: { $in: ['pending', 'approved', 'denied'] }
        })
        .populate('visitor', 'name email contactNumber')
        .populate('host', 'name department');

        res.json(requests.map(formatVisitResponse));
    } catch (error) {
        console.error('Error fetching host requests:', error);
        res.status(500).json({ message: 'Error fetching requests' });
    }
});

// Approve/reject visit
router.put('/approve-visit/:visitId', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const visit = await Visitor.findOneAndUpdate(
            { _id: req.params.visitId, host: req.user._id },
            {
                status,
                checkIn: status === 'approved' ? Date.now() : undefined
            },
            { new: true }
        )
        .populate('visitor', 'name email contactNumber')
        .populate('host', 'name department');

        if (!visit) {
            return res.status(404).json({ message: 'Visit request not found' });
        }

        res.json(formatVisitResponse(visit));
    } catch (error) {
        console.error('Error updating visit status:', error);
        res.status(500).json({ message: 'Error updating visit status' });
    }
});

// Get visitor's visits
router.get('/my-visits', authMiddleware, async (req, res) => {
    try {
        const visits = await Visitor.find({
            visitor: req.user._id
        })
        .populate('host', 'name department')
        .populate('visitor', 'name email contactNumber')
        .sort({ createdAt: -1 });

        res.json(visits.map(formatVisitResponse));
    } catch (error) {
        console.error('Error fetching visitor visits:', error);
        res.status(500).json({ message: 'Error fetching visits' });
    }
});

// Preapprove visit
// Validation middleware for pre-approval
const validatePreApproval = (req, res, next) => {
    const { visitorName, visitorEmail, visitorContact, purpose, company, startTime, endTime } = req.body;
    const errors = [];

    if (!visitorName) errors.push('Visitor name is required');
    if (!visitorEmail) errors.push('Visitor email is required');
    if (!visitorContact) errors.push('Visitor contact is required');
    if (!purpose) errors.push('Purpose is required');
    if (!company) errors.push('Company is required');
    if (!startTime) errors.push('Start time is required');
    if (!endTime) errors.push('End time is required');

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation error',
            errors
        });
    }

    next();
};

router.post('/preapprove', authMiddleware, validatePreApproval, async (req, res) => {
    try {
        console.log('Pre-approval request body:', req.body);
        // Map the fields from frontend to match our model
        const visitorData = {
            name: req.body.visitorName,
            email: req.body.visitorEmail,
            contactNumber: req.body.visitorContact,
            company: req.body.company,
            purpose: req.body.purpose,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            host: req.user._id,
            status: 'pre_approved'
        };

        const newVisit = new Visitor(visitorData);
        await newVisit.save();
        
        await newVisit.populate([
            { path: 'visitor', select: 'name email contactNumber' },
            { path: 'host', select: 'name department' }
        ]);

        res.status(201).json(formatVisitResponse(newVisit));
    } catch (error) {
        console.error('Error creating pre-approved visit:', error);
        res.status(500).json({ message: 'Error creating pre-approved visit' });
    }
});

// Get pre-approved visits
router.get('/pre-approved-visits', authMiddleware, async (req, res) => {
    try {
        const visits = await Visitor.find({
            status: 'pre_approved',
            host: req.user._id
        })
        .populate('visitor', 'name email contactNumber')
        .populate('host', 'name department')
        .sort({ createdAt: -1 });

        res.json(visits.map(formatVisitResponse));
    } catch (error) {
        console.error('Error fetching pre-approved visits:', error);
        res.status(500).json({ message: 'Error fetching pre-approved visits' });
    }
});

// Checkout visitor
router.put('/checkout/:visitId', authMiddleware, async (req, res) => {
    try {
        const visit = await Visitor.findOneAndUpdate(
            { _id: req.params.visitId },
            {
                status: 'completed',
                checkoutTime: Date.now()
            },
            { new: true }
        )
        .populate('visitor', 'name email contactNumber')
        .populate('host', 'name department');

        if (!visit) {
            return res.status(404).json({ message: 'Visit not found' });
        }
        
        res.json(formatVisitResponse(visit));
    } catch (error) {
        console.error('Error checking out visitor:', error);
        res.status(500).json({ message: 'Error checking out visitor' });
    }
});

module.exports = router;
