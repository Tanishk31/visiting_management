const mongoose = require('mongoose');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('MongoDB URI:', process.env.MONGO_URI);

const formatName = (name) => {
    if (!name) return name; // Return as is if name is null or undefined
    
    // Handle non-string values
    const nameStr = String(name).trim();
    if (!nameStr) return name;
    
    return nameStr.split(' ')
        .map(word => {
            if (!word) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .filter(word => word) // Remove empty strings
        .join(' ');
};

const updateNames = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Update User names
        const users = await User.find({});
        console.log(`Found ${users.length} users to update`);
        
        for (const user of users) {
            try {
                console.log('Processing user:', user._id, 'Current name:', user.name);
                const formattedName = formatName(user.name);
                if (formattedName !== user.name) {
                    user.name = formattedName;
                    await user.save();
                    console.log(`Updated user name: ${user._id} from "${user.name}" to "${formattedName}"`);
                }
            } catch (err) {
                console.error(`Error updating user ${user._id}:`, err);
            }
        }

        // Update Visitor hostNames
        const visitors = await Visitor.find({});
        console.log(`Found ${visitors.length} visitor records to update`);
        
        for (const visitor of visitors) {
            try {
                console.log('Processing visitor:', visitor._id, 'Current hostName:', visitor.hostName);
                const formattedHostName = formatName(visitor.hostName);
                if (formattedHostName !== visitor.hostName) {
                    visitor.hostName = formattedHostName;
                    await visitor.save();
                    console.log(`Updated visitor hostName: ${visitor._id} from "${visitor.hostName}" to "${formattedHostName}"`);
                }
            } catch (err) {
                console.error(`Error updating visitor ${visitor._id}:`, err);
            }
        }

        console.log('Name update completed successfully');
    } catch (error) {
        console.error('Error updating names:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

updateNames();