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
            try {
                const token = localStorage.getItem('token');
                console.log('Initializing auth with token:', token ? 'exists' : 'none');
                
                if (!token) {
                    console.log('No token found, clearing auth state');
                    setUser(null);
                    setLoading(false);
                    return;
                }

                // Verify token is valid by checking expiration
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.exp < Date.now() / 1000) {
                        console.log('Token expired, clearing auth state');
                        localStorage.removeItem('token');
                        setUser(null);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error('Invalid token format:', err);
                    localStorage.removeItem('token');
                    setUser(null);
                    setLoading(false);
                    return;
                }

                // Token looks valid, verify with server
                const response = await auth.getCurrentUser();
                if (response.data) {
                    console.log('User verified:', response.data);
                    setUser(response.data);
                } else {
                    console.log('No user data in response');
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
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
            console.log('Login response:', response);

            const { token, user } = response.data;
            
            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            // Save token
            localStorage.setItem('token', token);
            console.log('Token saved to localStorage');

            // Set user in state
            setUser(user);
            console.log('User state set:', user);

            return user;

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
            const response = await auth.register(userData);
            console.log('Registration response:', response);

            const { token, user } = response.data;
            
            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            // Save token
            localStorage.setItem('token', token);
            console.log('Token saved to localStorage');

            // Set user in state
            setUser(user);
            console.log('Registration successful:', user);
            return user;

        } catch (err) {
            console.error('Registration error:', err);
            localStorage.removeItem('token');
            setUser(null);
            
            if (err.response?.status === 400 && err.response.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Registration failed. Please try again.');
            }
            // Throw the original error with server message
            throw new Error(err.response?.data?.message || err.message);
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

    // Check if user has specific role from both state and token
    const hasRole = (role) => {
        if (!user?.role) {
            // If no user in state, check token
            const token = localStorage.getItem('token');
            if (!token) return false;
            
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.role === role;
            } catch (err) {
                console.error('Error checking role from token:', err);
                return false;
            }
        }
        return user.role === role;
    };

    // Verify authentication status
    const isAuthenticated = () => {
        if (!user) return false;
        
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch (err) {
            console.error('Error verifying token:', err);
            return false;
        }
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
        isAuthenticated: isAuthenticated()
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
