import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { auth, visitors, handleApiError } from "../utils/api";
import { isValidEmail, isValidPhone } from "../utils/helpers";
import "../styles/auth.css";

const CreateRequest = () => {
    const webcamRef = useRef(null);
    const [image, setImage] = useState(null);
    const [webcamOpen, setWebcamOpen] = useState(false);
    const [hosts, setHosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedHostId, setSelectedHostId] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        contact: "",
        purpose: "",
        company: "",
        hostName: "",
        hostContact: ""
    });

    // Fetch available hosts on component mount
    useEffect(() => {
        fetchHosts();
    }, []);

    const fetchHosts = async () => {
        try {
            const response = await auth.getHosts();
            console.log('Available hosts:', response.data);
            setHosts(response.data);
        } catch (err) {
            console.error('Error fetching hosts:', err);
            setError(handleApiError(err));
        }
    };

    const handleHostSelect = (e) => {
        const hostId = e.target.value;
        setSelectedHostId(hostId);

        const selectedHost = hosts.find(host => host._id === hostId);
        if (selectedHost) {
            console.log('Selected host:', selectedHost);
            setFormData({
                ...formData,
                hostName: selectedHost.name,
                hostContact: selectedHost.contactNumber
            });
        } else {
            setFormData({
                ...formData,
                hostName: "",
                hostContact: ""
            });
        }
    };

    const openWebcam = () => {
        setWebcamOpen(true);
        setImage(null);
    };

    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
        setWebcamOpen(false);
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError("Name is required");
            return false;
        }
        if (!isValidEmail(formData.email)) {
            setError("Please enter a valid email");
            return false;
        }
        if (!isValidPhone(formData.contact)) {
            setError("Please enter a valid contact number");
            return false;
        }
        if (!formData.purpose.trim()) {
            setError("Purpose of visit is required");
            return false;
        }
        if (!formData.company.trim()) {
            setError("Company name is required");
            return false;
        }
        if (!selectedHostId) {
            setError("Please select a host");
            return false;
        }
        if (!image) {
            setError("Please capture a photo");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Create FormData with all required fields
            const form = new FormData();
            
            // Basic visitor information
            form.append("name", formData.name);
            form.append("email", formData.email);
            form.append("contact", formData.contact);
            form.append("company", formData.company);
            form.append("purpose", formData.purpose);
            form.append("hostId", selectedHostId);

            // Convert and append photo
            const photoBlob = dataURItoBlob(image);
            form.append("photo", photoBlob);

            console.log('Submitting form data:', {
                name: formData.name,
                email: formData.email,
                contact: formData.contact,
                company: formData.company,
                purpose: formData.purpose,
                hostId: selectedHostId
            });

            const response = await visitors.createRequest(form);
            const host = hosts.find(h => h._id === selectedHostId);
            setSuccess(`Request sent successfully! An email notification has been sent to ${host.name} (${formData.hostContact}). Please wait for their approval.`);
            
            // Clear form
            setFormData({
                name: "",
                email: "",
                contact: "",
                purpose: "",
                company: "",
                hostName: "",
                hostContact: ""
            });
            setSelectedHostId("");
            setImage(null);
        } catch (err) {
            console.error("Error submitting request:", err);
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const dataURItoBlob = (dataURI) => {
        let byteString = atob(dataURI.split(",")[1]);
        let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
        let ab = new ArrayBuffer(byteString.length);
        let ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Visit Request</h2>
                
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

                <form onSubmit={handleSubmit} className="request-form">
                    <div className="form-group">
                        <label htmlFor="name">Your Name</label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="contact">Contact Number</label>
                        <input
                            type="tel"
                            id="contact"
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="company">Company</label>
                        <input
                            type="text"
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="purpose">Purpose of Visit</label>
                        <textarea
                            id="purpose"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="hostSelect">Select Host</label>
                        <select
                            id="hostSelect"
                            value={selectedHostId}
                            onChange={handleHostSelect}
                            disabled={loading}
                            required
                        >
                            <option value="">Select a host</option>
                            {hosts.map(host => (
                                <option key={host._id} value={host._id}>
                                    {host.name} - {host.department}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.hostName && (
                        <div className="form-group">
                            <label>Selected Host Details</label>
                            <div className="host-details">
                                <p><strong>Name:</strong> {formData.hostName}</p>
                                <p><strong>Contact:</strong> {formData.hostContact}</p>
                            </div>
                        </div>
                    )}

                    <div className="form-group webcam-section">
                        {!webcamOpen && !image && (
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={openWebcam}
                                disabled={loading}
                            >
                                Take Picture
                            </button>
                        )}

                        {webcamOpen && (
                            <div className="webcam-container">
                                <Webcam 
                                    ref={webcamRef} 
                                    screenshotFormat="image/jpeg"
                                    className="webcam"
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={capture}
                                    disabled={loading}
                                >
                                    Capture Photo
                                </button>
                            </div>
                        )}

                        {image && (
                            <div className="captured-image">
                                <img src={image} alt="Captured" className="visitor-photo" />
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={openWebcam}
                                    disabled={loading}
                                >
                                    Retake Photo
                                </button>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className={`btn btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? "Sending Request..." : "Send Request"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateRequest;
