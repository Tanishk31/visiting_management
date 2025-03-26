const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        set: function(value) {
            // Capitalize each word in the name
            return value.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
        validate: {
            validator: function(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            },
            message: 'Invalid email format'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['host', 'visitor'],
        required: [true, 'Role is required']
    },
    department: {
        type: String,
        required: function() {
            return this.role === 'host';
        },
        trim: true
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// Method to get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};

// Static method to find active hosts
userSchema.statics.findActiveHosts = function() {
    return this.find({ 
        role: 'host',
        status: 'active'
    })
    .select('name department contactNumber')
    .sort('name');
};

// Static method to find by email with role
userSchema.statics.findByEmailAndRole = function(email, role) {
    return this.findOne({
        email,
        role,
        status: 'active'
    });
};

// Create email index with proper error handling
userSchema.index({ email: 1 }, {
    unique: true,
    background: true,
    name: 'unique_email_index'
});

// Handle index errors
userSchema.on('index', function(error) {
    if (error) {
        console.error('User Schema Index Error:', error);
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
