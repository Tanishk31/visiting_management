import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is already logged in
    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await auth.getCurrentUser();
                    if (response.data) {
                        setUser(response.data);
                    } else {
                        throw new Error('No user data received');
                    }
                } catch (err) {
                    console.error('Auth initialization error:', err);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    // Login function
    const login = async (email, password) => {
        try {
            setError(null);
            setLoading(true);

            // Attempt login
            const response = await auth.login({ email, password });
            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            // Save token and user
            localStorage.setItem('token', token);
            
            // Verify token was saved
            const savedToken = localStorage.getItem('token');
            if (!savedToken) {
                throw new Error('Failed to save authentication token');
            }

            // Verify token works by making a test request
            try {
                const verifyResponse = await auth.getCurrentUser();
                if (!verifyResponse.data) {
                    throw new Error('Failed to verify authentication');
                }
                // Set user only after verification
                setUser(verifyResponse.data);
                return verifyResponse.data;
            } catch (verifyErr) {
                localStorage.removeItem('token');
                throw new Error('Failed to verify authentication');
            }

        } catch (err) {
            console.error('Login error:', err);
            localStorage.removeItem('token');
            setUser(null);
            setError(err.response?.data?.message || err.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Register function
    const register = async (userData) => {
        try {
            setError(null);
            setLoading(true);

            // Attempt registration
            console.log('Registering with data:', userData);
            const response = await auth.register(userData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.data) {
                throw new Error('No response from server');
            }
            
            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            // Save token
            localStorage.setItem('token', token);
            
            // Verify token was saved
            const savedToken = localStorage.getItem('token');
            if (!savedToken) {
                throw new Error('Failed to save authentication token');
            }

            // Verify token works by making a test request
            try {
                const verifyResponse = await auth.getCurrentUser();
                if (!verifyResponse.data) {
                    throw new Error('Failed to verify authentication');
                }
                // Set user only after verification
                setUser(verifyResponse.data);
                console.log('Registration and verification successful:', verifyResponse.data);
                return verifyResponse.data;
            } catch (verifyErr) {
                console.error('Verification error:', verifyErr);
                localStorage.removeItem('token');
                throw new Error('Failed to verify authentication after registration');
            }

        } catch (err) {
            console.error('Registration error:', err);
            localStorage.removeItem('token');
            setUser(null);
            setError(err.response?.data?.message || err.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        // Force page reload to clear any remaining state
        window.location.href = '/login';
    };

    // Update user profile
    const updateProfile = async (profileData) => {
        try {
            setError(null);
            const response = await auth.updateProfile(profileData);
            setUser(response.data);
            return response.data;
        } catch (err) {
            console.error('Profile update error:', err);
            setError(err.response?.data?.message || 'Profile update failed');
            throw err;
        }
    };

    // Check if user has specific role
    const hasRole = (role) => {
        return user?.role === role;
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        hasRole,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
