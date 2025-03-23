import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { visitors, auth, handleApiError } from '../utils/api';
import VisitorPass from '../components/VisitorPass';
import '../styles/visitorPass.css';
import '../styles/visitorDashboard.css';

const VisitorDashboard = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [showPreApproval, setShowPreApproval] = useState(false);
    const [hostEmail, setHostEmail] = useState("");
    const [preApprovalData, setPreApprovalData] = useState({
        purpose: "",
        company: "",
        startTime: "",
        endTime: ""
    });

    useEffect(() => {
        fetchVisitorData();
    }, []);

    const handlePreApprovalSubmit = async (e) => {
        e.preventDefault();
        try {
            setError("");
            setLoading(true);

            // Validate dates
            const now = new Date();
            const start = new Date(preApprovalData.startTime);
            const end = new Date(preApprovalData.endTime);

            if (start < now) {
                throw new Error("Start time must be in the future");
            }

            if (end <= start) {
                throw new Error("End time must be after start time");
            }

            await visitors.preApprove({
                hostEmail,
                ...preApprovalData
            });

            // Reset form
            setHostEmail("");
            setPreApprovalData({
                purpose: "",
                company: "",
                startTime: "",
                endTime: ""
            });

            setShowPreApproval(false);
            fetchVisitorData(); // Refresh data to show new pre-approval
        } catch (err) {
            console.error("Pre-approval error:", err);
            setError(err.message || handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const fetchVisitorData = async () => {
        try {
            setLoading(true);
            const response = await visitors.getMyVisits();
            
            // Sort visits by date, most recent first
            const sortedVisits = response.data
                .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
            
            setVisits(sortedVisits);

            // Show pass for most recent approved visit
            const latestApproved = sortedVisits.find(v => v.status === 'approved');
            if (latestApproved) {
                setSelectedVisit(latestApproved);
                setShowPass(true);
            }
        } catch (err) {
            console.error('Error fetching visitor data:', err);
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handlePrintPass = () => {
        window.print();
    };

    const closePassModal = () => {
        setShowPass(false);
        setSelectedVisit(null);
    };

    const viewPass = (visit) => {
        setSelectedVisit(visit);
        setShowPass(true);
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="visitor-dashboard">
            <h2>Welcome, {user?.name}</h2>

            {error && (
                <div className="alert alert-error">
                    <p>{error}</p>
                    <button onClick={() => setError("")} className="btn-close">×</button>
                </div>
            )}

            {/* Visitor Pass Modal */}
            {showPass && selectedVisit && (
                <div className="pass-modal">
                    <div className="pass-modal-content">
                        <button className="pass-modal-close" onClick={closePassModal}>×</button>
                        <VisitorPass visit={selectedVisit} />
                        <div className="pass-actions">
                            <button className="btn-print" onClick={handlePrintPass}>Print Pass</button>
                            <button className="btn-close" onClick={closePassModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <section className="dashboard-actions">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowPreApproval(true)}
                >
                    Request Pre-Approval
                </button>
            </section>

            {showPreApproval && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Request Pre-Approval</h3>
                        <form onSubmit={handlePreApprovalSubmit}>
                            <div className="form-group">
                                <label>Host Email:</label>
                                <input
                                    type="email"
                                    value={hostEmail}
                                    onChange={(e) => setHostEmail(e.target.value)}
                                    required
                                    placeholder="Enter host's email"
                                />
                            </div>
                            <div className="form-group">
                                <label>Purpose:</label>
                                <input
                                    type="text"
                                    value={preApprovalData.purpose}
                                    onChange={(e) => setPreApprovalData({
                                        ...preApprovalData,
                                        purpose: e.target.value
                                    })}
                                    required
                                    placeholder="Purpose of visit"
                                />
                            </div>
                            <div className="form-group">
                                <label>Company:</label>
                                <input
                                    type="text"
                                    value={preApprovalData.company}
                                    onChange={(e) => setPreApprovalData({
                                        ...preApprovalData,
                                        company: e.target.value
                                    })}
                                    required
                                    placeholder="Your company name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Start Time:</label>
                                <input
                                    type="datetime-local"
                                    value={preApprovalData.startTime}
                                    onChange={(e) => setPreApprovalData({
                                        ...preApprovalData,
                                        startTime: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Time:</label>
                                <input
                                    type="datetime-local"
                                    value={preApprovalData.endTime}
                                    onChange={(e) => setPreApprovalData({
                                        ...preApprovalData,
                                        endTime: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? "Submitting..." : "Submit Request"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowPreApproval(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <section className="approved-visits">
                <h3>Your Visits</h3>
                <div className="visits-grid">
                    {visits.map(visit => (
                        <div key={visit._id} className="visit-card">
                            <div className="visit-header">
                                <h4>Visit on {new Date(visit.checkIn).toLocaleDateString()}</h4>
                            </div>
                            <div className="visit-body">
                                <p><strong>Host:</strong> {visit.host?.name || 'N/A'}</p>
                                <p><strong>Purpose:</strong> {visit.purpose}</p>
                                <p><strong>Status:</strong> {visit.status}</p>
                                <button 
                                    onClick={() => viewPass(visit)}
                                    className="btn btn-primary"
                                >
                                    View Pass
                                </button>
                            </div>
                        </div>
                    ))}
                    {visits.length === 0 && (
                        <p className="no-data">No approved visits found</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default VisitorDashboard;