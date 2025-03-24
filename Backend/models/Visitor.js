const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    visitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Visitor name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    purpose: {
        type: String,
        required: [true, 'Purpose of visit is required'],
        trim: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    checkIn: {
        type: Date
    },
    checkOut: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'pre_approved'],
        default: 'pending',
        index: true
    },
    photo: {
        type: String
    },
    qrCode: {
        type: String
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
visitorSchema.index({ host: 1, status: 1 });
visitorSchema.index({ visitor: 1, status: 1 });
visitorSchema.index({ startTime: 1, endTime: 1 });

// Method to get formatted data
visitorSchema.methods.getFormattedData = function() {
    const visitor = this.toObject();
    
    visitor.checkInFormatted = visitor.checkIn ?
        new Date(visitor.checkIn).toLocaleString() : 'Not checked in';
    
    visitor.checkOutFormatted = visitor.checkOut ?
        new Date(visitor.checkOut).toLocaleString() : 'Not checked out';
    
    visitor.statusFormatted = visitor.status.charAt(0).toUpperCase() +
        visitor.status.slice(1);

    return visitor;
};

// Pre-save middleware to validate time slots
visitorSchema.pre('save', function(next) {
    if (this.startTime && this.endTime) {
        const startTime = new Date(this.startTime);
        const endTime = new Date(this.endTime);
        if (startTime >= endTime) {
            next(new Error('End time must be after start time'));
        }
    }
    next();
});

// Static methods
visitorSchema.statics.findActiveVisits = function(hostId) {
    return this.find({
        host: hostId,
        status: { $in: ['active', 'approved'] }
    }).populate('visitor', 'name email contactNumber');
};

visitorSchema.statics.findByDateRange = function(startDate, endDate, hostId = null) {
    const query = {
        startTime: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (hostId) {
        query.host = hostId;
    }

    return this.find(query).sort({ startTime: -1 });
};

module.exports = mongoose.model('Visitor', visitorSchema);
