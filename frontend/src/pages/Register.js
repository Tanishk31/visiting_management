import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { handleApiError } from "../utils/api";
import "../styles/auth.css";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "", // Empty by default to force selection
        department: "",
        contactNumber: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { register: authRegister } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!formData.role) {
            setError("Please select your role");
            return false;
        }
        
        if (formData.role === 'host' && !formData.department) {
            setError("Department is required for hosts");
            return false;
        }

        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            return false;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            return false;
        }

        if (!formData.contactNumber) {
            setError("Contact number is required");
            return false;
        }

        return true;
    };

    // Email validation on change
    const handleEmailChange = (e) => {
        const email = e.target.value;
        handleChange(e);
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address");
        } else {
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Register and automatically log in
            await authRegister(formData);
            console.log("Registration and authentication successful");
            
            // Navigate based on role
            const destination = formData.role === 'host' ? '/host-dashboard' : '/';
            console.log(`Navigating to ${destination}`);
            navigate(destination);
        } catch (err) {
            console.error("Registration error:", err);
            setError('User already exists!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Register</h2>
                
                {error && (
                    <div className="alert alert-error">
                        <p>{error}</p>
                        <button onClick={() => setError("")} className="btn-close">×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="role-selection">
                        <label>I want to register as:</label>
                        <div className="role-buttons">
                            <button
                                type="button"
                                className={`role-btn ${formData.role === 'host' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, role: 'host' })}
                            >
                                Host
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${formData.role === 'visitor' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, role: 'visitor' })}
                            >
                                Visitor
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleEmailChange}
                            required
                            disabled={loading}
                            placeholder="Enter your email"
                            autoComplete="email"
                            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                            title="Please enter a valid email address"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Create a password"
                            autoComplete="new-password"
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="contactNumber">Contact Number</label>
                        <input
                            type="tel"
                            id="contactNumber"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your contact number"
                        />
                    </div>

                    {formData.role === 'host' && (
                        <div className="form-group">
                            <label htmlFor="department">Department</label>
                            <input
                                type="text"
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Enter your department"
                            />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className={`btn btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading || !formData.role}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;
