const qr = require('qrcode');
const crypto = require('crypto');

// Generate a unique QR code for a visitor pass
const generateVisitorQR = async (visitData) => {
    // Create a unique identifier for the QR code
    const qrId = crypto.randomBytes(16).toString('hex');
    
    // Create payload with essential visit information
    const payload = {
        id: qrId,
        visitId: visitData._id,
        visitorName: visitData.name,
        visitorEmail: visitData.email,
        startTime: visitData.preApproval.startTime,
        endTime: visitData.preApproval.endTime,
        hostName: visitData.hostName
    };

    try {
        // Generate QR code as data URL
        const qrCodeDataUrl = await qr.toDataURL(JSON.stringify(payload));
        return {
            qrId,
            qrCodeDataUrl
        };
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

// Validate a pre-approved time window
const isValidTimeWindow = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Start time must be in the future
    if (start <= now) {
        throw new Error('Start time must be in the future');
    }

    // End time must be after start time
    if (end <= start) {
        throw new Error('End time must be after start time');
    }

    // Time window cannot be more than 24 hours
    const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (end - start > maxDuration) {
        throw new Error('Time window cannot exceed 24 hours');
    }

    return true;
};

// Check if a pre-approved visit is expired
const isVisitExpired = (visit) => {
    if (!visit.preApproval?.startTime || !visit.preApproval?.endTime) {
        return true;
    }

    const now = new Date();
    const startTime = new Date(visit.preApproval.startTime);
    const endTime = new Date(visit.preApproval.endTime);

    // Visit is expired if current time is outside the approved window
    return now < startTime || now > endTime;
};

module.exports = {
    generateVisitorQR,
    isValidTimeWindow,
    isVisitExpired
};