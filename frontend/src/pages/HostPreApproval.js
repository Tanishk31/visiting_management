import { useState } from "react";
import { visitors } from "../utils/api";
import "../styles/auth.css";

const HostPreApproval = () => {
    const [formData, setFormData] = useState({
        visitorName: "",
        visitorEmail: "",
        visitorContact: "",
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

        // Check if start time is in the future
        if (new Date(formData.startTime) <= new Date()) {
            setError("Start time must be in the future.");
            setLoading(false);
            return;
        }

        try {
            console.log('Creating pre-approval with data:', formData);
            await visitors.createPreApproval(formData);
            alert("Visitor pre-approved successfully! They will receive an email with the QR code.");
            // Clear form
            setFormData({
                visitorName: "",
                visitorEmail: "",
                visitorContact: "",
                purpose: "",
                company: "",
                startTime: "",
                endTime: ""
            });
        } catch (err) {
            console.error('Pre-approval error:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Error creating pre-approval. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-container">
            <h2>Pre-Approve Visitor</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        name="visitorName"
                        placeholder="Visitor Name"
                        value={formData.visitorName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        name="visitorEmail"
                        placeholder="Visitor Email"
                        value={formData.visitorEmail}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        name="visitorContact"
                        placeholder="Visitor Contact"
                        value={formData.visitorContact}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        name="company"
                        placeholder="Visitor's Company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        name="purpose"
                        placeholder="Purpose of Visit"
                        value={formData.purpose}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Start Time</label>
                    <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>End Time</label>
                    <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Creating Pre-Approval..." : "Create Pre-Approval"}
                </button>
            </form>
        </div>
    );
};

export default HostPreApproval;