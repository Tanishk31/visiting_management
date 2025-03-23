/**
 * Format date for display
 * @param {string|Date} dateString - The date to format
 * @param {boolean} includeTime - Whether to include time in the formatted string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(includeTime && {
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    return date.toLocaleString('en-US', options);
};

/**
 * Calculate duration between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted duration string
 */
export const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
        return `${minutes} minutes`;
    }
    return `${hours}h ${minutes}m`;
};

/**
 * Format status for display
 * @param {string} status - The status to format
 * @returns {string} Formatted status string
 */
export const formatStatus = (status) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone number is valid
 */
export const isValidPhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(phone);
};

/**
 * Format error message for display
 * @param {Error|string} error - Error object or message
 * @returns {string} Formatted error message
 */
export const formatError = (error) => {
    if (!error) return '';
    
    if (typeof error === 'string') return error;
    
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    
    return error.message || 'An unexpected error occurred';
};

/**
 * Group visits by date
 * @param {Array} visits - Array of visit objects
 * @returns {Object} Visits grouped by date
 */
export const groupVisitsByDate = (visits) => {
    return visits.reduce((groups, visit) => {
        const date = new Date(visit.checkIn).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(visit);
        return groups;
    }, {});
};

/**
 * Get status color class
 * @param {string} status - The status
 * @returns {string} CSS class name for the status
 */
export const getStatusColorClass = (status) => {
    const statusMap = {
        pending: 'status-pending',
        approved: 'status-approved',
        denied: 'status-denied',
        'checked-out': 'status-checked-out'
    };
    return statusMap[status] || 'status-default';
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Get time slots for a given date
 * @param {Date} date - The date to get time slots for
 * @returns {Array} Array of time slot objects
 */
export const getTimeSlots = (date) => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute of ['00', '30']) {
            const time = new Date(date);
            time.setHours(hour, parseInt(minute), 0);
            slots.push({
                time,
                label: time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            });
        }
    }
    
    return slots;
};