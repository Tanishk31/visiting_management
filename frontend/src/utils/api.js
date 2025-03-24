import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// API request helper with token validation
const makeAuthRequest = async (requestFn) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            throw new Error('No authentication token');
        }

        // Check token expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp < Date.now() / 1000) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Token expired');
        }

        // Make the request with token
        const response = await requestFn();
        return response;
    } catch (error) {
        console.error('API request error:', error);
        if (error.response?.status === 401 || error.message.includes('token')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw error;
    }
};

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Global request interceptor for authentication
api.interceptors.request.use(
    async config => {
        const token = localStorage.getItem('token');
        
        // Skip token check for auth endpoints
        if (config.url.includes('/auth/')) {
            return config;
        }

        try {
            if (!token) {
                throw new Error('No authentication token');
            }

            // Check token expiration
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp < Date.now() / 1000) {
                localStorage.removeItem('token');
                throw new Error('Token expired');
            }

            // Add token to request
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        } catch (error) {
            console.error('Request interceptor error:', error);
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(error);
        }
    },
    error => Promise.reject(error)
);

// Global response interceptor for authentication errors
api.interceptors.response.use(
    response => response,
    error => {
        // Handle validation errors
        if (error.response?.status === 400) {
            console.error('Validation error:', error.response.data);
            const errorMessage = error.response.data.errors
                ? error.response.data.errors.join(', ')
                : error.response.data.message;
            return Promise.reject(new Error(errorMessage));
        }
        
        // Handle authentication errors
        if (error.response?.status === 401) {
            console.error('Authentication error:', error);
            localStorage.removeItem('token');
            // Don't redirect if it's a login request
            if (!error.config.url.includes('/auth/login')) {
                window.location.href = '/login';
            }
        }

        // Handle other errors
        return Promise.reject(error);
    }
);

// Debug interceptors
api.interceptors.request.use(request => {
    const timestamp = new Date().toISOString();
    console.group(`🌐 API Request [${timestamp}]`);
    console.log('URL:', request.url);
    console.log('Method:', request.method);
    console.log('Headers:', request.headers);
    console.log('Data:', request.data);
    console.groupEnd();
    return request;
});

api.interceptors.response.use(
    response => {
        const timestamp = new Date().toISOString();
        console.group(`✅ API Response [${timestamp}]`);
        console.log('URL:', response.config.url);
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.groupEnd();
        return response;
    },
    error => {
        const timestamp = new Date().toISOString();
        console.group(`❌ API Error [${timestamp}]`);
        console.log('URL:', error.config?.url);
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
        console.log('Error:', error.message);
        console.groupEnd();
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => {
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
            
            // Only redirect if not a login attempt or user verification
            if (!originalRequest.url.includes('/auth/login') &&
                !originalRequest.url.includes('/auth/me')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const auth = {
    login: (credentials) =>
        api.post('/auth/login', credentials, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true
        }),
    
    register: (userData) =>
        api.post('/auth/register', userData)
            .then(response => response)
            .catch(error => {
                if (error.response?.status === 400) {
                    throw new Error("User already exists!");
                }
                throw error;
            }),
    
    getCurrentUser: () =>
        api.get('/auth/me', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true
        }),
    
    updateProfile: (userData) => 
        api.put('/auth/profile', userData),
    
    // Get list of active hosts
    getHosts: () => 
        api.get('/auth/hosts')
};

// Visitor API calls with authentication
export const visitors = {
    createRequest: (formData) => makeAuthRequest(() =>
        api.post('/visitors/visit-request', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
            },
            withCredentials: true
        })
    ),

    getHostRequests: () => makeAuthRequest(() =>
        api.get('/visitors/host-requests')
    ),

    getActiveVisits: () => makeAuthRequest(() =>
        api.get('/visitors/active-visits')
    ),

    getVisitsByDateRange: (startDate, endDate) => makeAuthRequest(() =>
        api.get(`/visitors/date-range?startDate=${startDate}&endDate=${endDate}`)
    ),
    
    approveVisit: (visitId, status) => makeAuthRequest(() =>
        api.put(`/visitors/approve-visit/${visitId}`, { status })
    ),
    
    checkoutVisitor: (visitId) => makeAuthRequest(() =>
        api.put(`/visitors/checkout/${visitId}`, {})
    ),

    getRequestsByHost: (hostId) => makeAuthRequest(() =>
        api.get(`/visitors/requests/${hostId}`)
    ),

    getMyVisits: () => makeAuthRequest(() =>
        api.get('/visitors/my-visits')
    ),

    // Create pre-approval for a visitor (used by hosts)
    createPreApproval: async (data) => makeAuthRequest(async () => {
        console.log('Making pre-approval request with data:', data);
        return api.post('/visitors/preapprove', {
            visitorName: data.visitorName,
            visitorEmail: data.visitorEmail,
            visitorContact: data.visitorContact,
            company: data.company,
            purpose: data.purpose,
            startTime: new Date(data.startTime).toISOString(),
            endTime: new Date(data.endTime).toISOString()
        });
    }),

    // Request pre-approval as a visitor
    preApprove: (data) => makeAuthRequest(() =>
        api.post('/visitors/preapprove', {
            ...data,
            startTime: new Date(data.startTime).toISOString(),
            endTime: new Date(data.endTime).toISOString()
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
    ),

    getPreApprovedVisits: () => makeAuthRequest(() =>
        api.get('/visitors/pre-approved-visits')
    ),

    cancelPreApproval: (visitId) => makeAuthRequest(() =>
        api.delete(`/visitors/pre-approval/${visitId}`)
    )
};

// Enhanced error handler with detailed feedback
export const handleApiError = (error) => {
    console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
    });

    // Return backend validation error messages
    if (error.response?.status === 400 && error.response?.data?.message) {
        return error.response.data.message;
    }

    // Authentication errors
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        return 'Invalid credentials. Please try again.';
    }

    // Handle registration errors specifically
    if (error.response?.status === 400) {
        if (error.response.data?.message?.includes('already exists')) {
            return 'User already exists with this email';
        }
        if (error.response.data?.message) {
            return error.response.data.message;
        }
    }

    // Handle network errors
    if (!error.response || error.message === 'Network Error') {
        return 'Network error. Please check your internet connection and try again.';
    }

    // Default to server error message if available
    return error.response?.data?.message || 'An error occurred. Please try again.';
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