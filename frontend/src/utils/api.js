import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3000'
    },
    withCredentials: true,
    validateStatus: status => {
        return (status >= 200 && status < 300) || status === 304;
    }
});

// Handle OPTIONS requests
api.interceptors.request.use(config => {
    if (config.method === 'options') {
        config.headers['Access-Control-Request-Method'] = 'POST, GET, PUT, DELETE';
        config.headers['Access-Control-Request-Headers'] = 'Content-Type, Authorization';
    }
    return config;
});

// Debug interceptor
api.interceptors.request.use(request => {
    console.log('Starting API Request:', {
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data
    });
    return request;
});

api.interceptors.response.use(
    response => {
        console.log('API Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers
        });
        return response;
    },
    error => {
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            config: error.config
        });
        return Promise.reject(error);
    }
);

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Avoid infinite loop for login/register endpoints
        if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register')) {
            return Promise.reject(error);
        }

        // Handle unauthorized errors
        if (error.response?.status === 401) {
            // Remove invalid token
            localStorage.removeItem('token');
            
            // Only redirect if not trying to verify current user
            if (!originalRequest.url.includes('/auth/me')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const auth = {
    login: (credentials) => 
        api.post('/auth/login', credentials),
    
    register: (userData) => 
        api.post('/auth/register', userData),
    
    getCurrentUser: () => 
        api.get('/auth/me'),
    
    updateProfile: (userData) => 
        api.put('/auth/profile', userData),
    
    // Get list of active hosts
    getHosts: () => 
        api.get('/auth/hosts')
};

// Visitor API calls
export const visitors = {
    createRequest: (formData) =>
        api.post('/visitors/visit-request', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
    
    getHostRequests: () =>
        api.get('/visitors/host-requests'),
    
    getActiveVisits: () =>
        api.get('/visitors/active-visits'),
    
    getVisitsByDateRange: (startDate, endDate) =>
        api.get(`/visitors/date-range?startDate=${startDate}&endDate=${endDate}`),
    
    approveVisit: (visitId, status) =>
        api.put(`/visitors/approve-visit/${visitId}`, { status }),
    
    checkoutVisitor: (visitId) =>
        api.put(`/visitors/checkout/${visitId}`),

    // Get requests by host
    getRequestsByHost: (hostId) =>
        api.get(`/visitors/requests/${hostId}`),

    // Get visits for a specific visitor
    getMyVisits: () =>
        api.get('/visitors/my-visits'),

    // Request pre-approval as a visitor
    preApprove: (data) => {
        const formattedData = {
            ...data,
            startTime: new Date(data.startTime).toISOString(),
            endTime: new Date(data.endTime).toISOString()
        };
        return api.post('/visitors/pre-approve', formattedData);
    },

    // Create a pre-approved visit (by host)
    createPreApproval: (data) => {
        const formattedData = {
            ...data,
            startTime: new Date(data.startTime).toISOString(),
            endTime: new Date(data.endTime).toISOString()
        };
        return api.post('/visitors/create-pre-approval', formattedData);
    },

    // Get pre-approved visits for a host
    getPreApprovedVisits: () =>
        api.get('/visitors/pre-approved-visits'),

    // Cancel a pre-approved visit
    cancelPreApproval: (visitId) =>
        api.delete(`/visitors/pre-approval/${visitId}`)
};

// Error handler
export const handleApiError = (error) => {
    console.error('API Error:', error);
    
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    
    if (!error.response) {
        return 'Network error. Please check your connection.';
    }
    
    return 'An unexpected error occurred. Please try again.';
};

// File upload helper
export const uploadFile = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

// Check authentication status
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        // Check if token is expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
    } catch {
        return false;
    }
};

export default api;