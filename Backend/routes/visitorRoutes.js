const express = require('express');
const router = express.Router();

// Test route without any middleware or complex logic
router.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

router.post('/test', (req, res) => {
    res.json({ message: 'POST test route working', body: req.body });
});

// Basic preapprove route
router.post('/preapprove', (req, res) => {
    try {
        console.log('Preapprove route accessed');
        console.log('Request body:', req.body);
        res.json({ 
            message: 'Preapprove route hit successfully',
            receivedData: req.body
        });
    } catch (error) {
        console.error('Error in preapprove route:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export router
module.exports = router;
