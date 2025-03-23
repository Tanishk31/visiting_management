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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (new Date(formData.startTime) >= new Date(formData.endTime)) {
            setError("End time must be after start time.");
            setLoading(false);
            return;
        }

        try {
            // Validate email format
            if (!formData.hostEmail.match(/^\S+@\S+\.\S+$/)) {
                setError("Please enter a valid host email address");
                setLoading(false);
                return;
            }

            // Validate dates
            const start = new Date(formData.startTime);
            const end = new Date(formData.endTime);
            const now = new Date();

            if (start <= now) {
                setError("Start time must be in the future");
                setLoading(false);
                return;
            }

            console.log('Preparing to submit pre-approval with data:', formData);
            console.log('Current auth token:', localStorage.getItem('token'));

            const response = await visitors.preApprove(formData);
            console.log('Pre-approval response:', response);
            
            setFormData({
                hostEmail: "",
                purpose: "",
                company: "",
                startTime: "",
                endTime: ""
            });
            
            alert("Pre-approval request submitted successfully!");
        } catch (err) {
            console.error('Pre-approval error:', err);
            console.error('Error response:', err.response);
            
            let errorMessage = "Error submitting pre-approval request.";
            
            if (err.response?.status === 403) {
                errorMessage = "Access denied. Please make sure you are logged in as a visitor.";
            } else if (err.response?.status === 404) {
                errorMessage = "Host not found. Please verify the host email address.";
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (!err.response) {
                errorMessage = "Network error. Please check your connection.";
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-container">
            <h2>Pre-Approval Request</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input type="email" name="hostEmail" placeholder="Host Email" onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <input type="text" name="company" placeholder="Company" onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <input type="text" name="purpose" placeholder="Purpose of Visit" onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Start Time</label>
                    <input type="datetime-local" name="startTime" onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>End Time</label>
                    <input type="datetime-local" name="endTime" onChange={handleChange} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Pre-Approval"}
                </button>
            </form>
        </div>
    );
};

export default PreApproval;
