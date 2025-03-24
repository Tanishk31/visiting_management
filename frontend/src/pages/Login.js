import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        e.preventDefault();
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent form submission
        e.stopPropagation(); // Stop event bubbling
        
        if (loading) return; // Prevent multiple submissions
        
        setError("");
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);
            
            if (!user || !user.role) {
                throw new Error('Invalid user response');
            }

            // Use role-based navigation
            const path = user.role === 'host' ? '/host-dashboard' : '/visitor-dashboard';
            navigate(path, { replace: true });
        } catch (err) {
            console.error("Login error:", err);
            if (err.response?.status === 401) {
                setError("Invalid email or password");
            } else {
                setError(
                    err.response?.data?.message ||
                    "Failed to login. Please check your credentials."
                );
            }
            // Clear password field on error
            setFormData(prev => ({
                ...prev,
                password: ""
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Login</h2>
                
                {error && (
                    <div className="alert alert-error">
                        <p>{error}</p>
                        <button onClick={() => setError("")} className="btn-close">×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your email"
                            autoComplete="email"
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
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={`btn btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    <div className="auth-links">
                        <p>
                            Don't have an account?{" "}
                            <button
                                type="button"
                                className="link-button"
                                onClick={() => navigate("/register")}
                                disabled={loading}
                            >
                                Register here
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
