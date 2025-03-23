const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Visitor name is required'],
        trim: true
    },
    contact: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    purpose: {
        type: String,
        required: [true, 'Purpose of visit is required'],
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    hostName: {
        type: String,
        required: [true, 'Host name is required'],
        trim: true,
        set: function(value) {
            // Capitalize each word in the name, matching User model format
            return value.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        },
        index: true // Add index for better query performance
    },
    hostContact: {
        type: String,
        required: [true, 'Host contact is required'],
        trim: true
    },
    checkIn: {
        type: Date,
        default: Date.now
    },
    checkOut: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'checked-out', 'pre-approved'],
        default: 'pending',
        index: true // Add index for better query performance
    },
    photo: {
        type: String
    },
    preApproval: {
        startTime: Date,
        endTime: Date,
        qrCode: String,
        isExpired: {
            type: Boolean,
            default: false
        },
        approvedBy: {
            type: String,
            required: function() {
                return this.status === 'pre-approved';
            }
        }
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for common queries
visitorSchema.index({ hostName: 1, status: 1, checkIn: -1 });

// Method to get formatted data
visitorSchema.methods.getFormattedData = function() {
    const visitor = this.toObject();
    
    // Format dates
    visitor.checkInFormatted = visitor.checkIn ? 
        new Date(visitor.checkIn).toLocaleString() : 'Not checked in';
    
    visitor.checkOutFormatted = visitor.checkOut ? 
        new Date(visitor.checkOut).toLocaleString() : 'Not checked out';
    
    // Format status for display
    visitor.statusFormatted = visitor.status.charAt(0).toUpperCase() + 
        visitor.status.slice(1);

    return visitor;
};

// Pre-save middleware to validate time slots
visitorSchema.pre('save', function(next) {
    if (this.preApproval && this.preApproval.startTime && this.preApproval.endTime) {
        const startTime = new Date(this.preApproval.startTime);
        const endTime = new Date(this.preApproval.endTime);
        if (startTime >= endTime) {
            next(new Error('End time must be after start time'));
        }
    }
    next();
});

// Static method to find active visits for a host
visitorSchema.statics.findActiveVisits = function(hostName) {
    return this.find({
        hostName,
        status: { $in: ['pending', 'approved', 'pre-approved'] },
        checkOut: { $exists: false }
    }).sort({ checkIn: -1 });
};

// Static method to find visits by date range
visitorSchema.statics.findByDateRange = function(startDate, endDate, hostName = null) {
    const query = {
        checkIn: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (hostName) {
        query.hostName = hostName;
    }

    return this.find(query).sort({ checkIn: -1 });
};

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
