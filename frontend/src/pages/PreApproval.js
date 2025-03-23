import { useState } from "react";
import "../styles/auth.css";
import { visitors } from "../utils/api";

const PreApproval = () => {
    const [formData, setFormData] = useState({
        hostEmail: "",
        purpose: "",
        company: "",
        startTime: "",
        endTime: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        if (!formData.hostEmail.match(/^\S+@\S+\.\S+$/)) {
            throw new Error("Please enter a valid host email address");
        }

        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);
        const now = new Date();

        if (startTime <= now) {
            throw new Error("Start time must be in the future");
        }

        if (startTime >= endTime) {
            throw new Error("End time must be after start time");
        }

        if (!formData.purpose.trim()) {
            throw new Error("Please enter the purpose of visit");
        }

        if (!formData.company.trim()) {
            throw new Error("Please enter your company name");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // Validate form
            validateForm();

            console.log('Preparing to submit pre-approval with data:', {
                ...formData,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString()
            });

            const response = await visitors.preApprove(formData);
            console.log('Pre-approval response:', response);

            setFormData({
                hostEmail: "",
                purpose: "",
                company: "",
                startTime: "",
                endTime: ""
            });

            setSuccess("Pre-approval request submitted successfully!");

        } catch (err) {
            console.error('Pre-approval error:', {
                message: err.message,
                response: err.response,
                data: err.response?.data
            });

            let errorMessage;

            if (err.message && !err.response) {
                // Local validation errors
                errorMessage = err.message;
            } else if (err.response?.status === 403) {
                errorMessage = "Access denied. Please make sure you are logged in as a visitor.";
            } else if (err.response?.status === 404) {
                errorMessage = "Host not found. Please verify the host email address.";
            } else if (err.response?.status === 400) {
                errorMessage = err.response.data?.message || "Invalid request. Please check your input.";
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (!err.response) {
                errorMessage = "Network error. Please check your connection.";
            } else {
                errorMessage = "Error submitting pre-approval request. Please try again.";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error when user starts typing
        if (error) setError("");
        if (success) setSuccess("");
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Pre-Approval Request</h2>
                
                {error && (
                    <div className="alert alert-error">
                        <p>{error}</p>
                        <button onClick={() => setError("")} className="btn-close">×</button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <p>{success}</p>
                        <button onClick={() => setSuccess("")} className="btn-close">×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="hostEmail">Host Email</label>
                        <input
                            type="email"
                            id="hostEmail"
                            name="hostEmail"
                            value={formData.hostEmail}
                            onChange={handleChange}
                            placeholder="Enter host's email address"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="company">Company</label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="Enter your company name"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="purpose">Purpose of Visit</label>
                        <input
                            type="text"
                            id="purpose"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            placeholder="Enter purpose of visit"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="startTime">Start Time</label>
                        <input
                            type="datetime-local"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endTime">End Time</label>
                        <input
                            type="datetime-local"
                            id="endTime"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={`btn btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Submit Pre-Approval"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PreApproval;
