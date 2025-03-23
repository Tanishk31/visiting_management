import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visitors, handleApiError } from '../utils/api';
import { formatDate, groupVisitsByDate, getStatusColorClass } from '../utils/helpers';
import VisitorPass from '../components/VisitorPass';
import '../styles/hostDashboard.css';
import '../styles/visitorPass.css';

const HostDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        checkedOut: 0
    });
    const [activeVisits, setActiveVisits] = useState([]);
    const [recentVisits, setRecentVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [showPass, setShowPass] = useState(false);
    
    useEffect(() => {
        // Wait for auth to be initialized
        if (authLoading) {
            return;
        }

        if (!user || user.role !== 'host') {
            navigate('/login');
            return;
        }
        
        fetchDashboardData();
    }, [user, authLoading, navigate]);

    if (authLoading) {
        return <div className="loading">Loading authentication...</div>;
    }

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            // Fetch active visits
            const activeResponse = await visitors.getActiveVisits();
            setActiveVisits(activeResponse.data);

            // Fetch all visits for stats
            const allVisits = await visitors.getHostRequests();
            const visits = allVisits.data;

            // Calculate stats
            const statistics = visits.reduce((acc, visit) => {
                acc.total++;
                acc[visit.status]++;
                return acc;
            }, {
                total: 0,
                pending: 0,
                approved: 0,
                denied: 0,
                checkedOut: 0
            });

            setStats(statistics);

            // Get recent visits (last 5)
            setRecentVisits(visits.slice(0, 5));

        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (visitId, newStatus, visit) => {
        try {
            await visitors.approveVisit(visitId, newStatus);
            if (newStatus === 'approved') {
                setSelectedVisit(visit);
                setShowPass(true);
            }
            fetchDashboardData(); // Refresh data
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const handlePrintPass = () => {
        window.print();
    };

    const closePassModal = () => {
        setShowPass(false);
        setSelectedVisit(null);
    };

    const handleCheckout = async (visitId) => {
        try {
            await visitors.checkoutVisitor(visitId);
            fetchDashboardData(); // Refresh data
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            <h2>Welcome, {user.name}</h2>
            
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

            <div className="stats-grid">
                <div className="stat-card total">
                    <h3>Total Requests</h3>
                    <p>{stats.total}</p>
                </div>
                <div className="stat-card pending">
                    <h3>Pending</h3>
                    <p>{stats.pending}</p>
                </div>
                <div className="stat-card approved">
                    <h3>Approved</h3>
                    <p>{stats.approved}</p>
                </div>
                <div className="stat-card denied">
                    <h3>Denied</h3>
                    <p>{stats.denied}</p>
                </div>
            </div>

            <section className="active-visits-section">
                <h3>Active Visits ({activeVisits.length})</h3>
                <div className="requests-grid">
                    {activeVisits.map(visit => (
                        <div key={visit._id} className="request-card">
                            <div className="request-header">
                                <h4>{visit.name}</h4>
                                <span className={`status ${getStatusColorClass(visit.status)}`}>
                                    {visit.status}
                                </span>
                            </div>
                            <div className="request-body">
                                <p><strong>Company:</strong> {visit.company}</p>
                                <p><strong>Purpose:</strong> {visit.purpose}</p>
                                <p><strong>Contact:</strong> {visit.contact}</p>
                                <p><strong>Check-in:</strong> {formatDate(visit.checkIn)}</p>
                                {visit.photo && (
                                    <img 
                                        src={`http://localhost:5000/${visit.photo}`} 
                                        alt="Visitor" 
                                        className="visitor-photo"
                                        onClick={() => window.open(`http://localhost:5000/${visit.photo}`, '_blank')}
                                    />
                                )}
                                {visit.status === 'pending' && (
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => handleStatusChange(visit._id, 'approved', visit)}
                                            className="btn btn-success"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(visit._id, 'denied')}
                                            className="btn btn-danger"
                                        >
                                            Deny
                                        </button>
                                    </div>
                                )}
                                {visit.status === 'approved' && (
                                    <button 
                                        onClick={() => handleCheckout(visit._id)}
                                        className="btn btn-primary"
                                    >
                                        Check Out
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {activeVisits.length === 0 && (
                        <p className="no-data">No active visits</p>
                    )}
                </div>
            </section>

            <section className="recent-visits-section">
                <h3>Recent Visits</h3>
                <div className="requests-grid">
                    {recentVisits.map(visit => (
                        <div key={visit._id} className="request-card">
                            <div className="request-header">
                                <h4>{visit.name}</h4>
                                <span className={`status ${getStatusColorClass(visit.status)}`}>
                                    {visit.status}
                                </span>
                            </div>
                            <div className="request-body">
                                <p><strong>Company:</strong> {visit.company}</p>
                                <p><strong>Check-in:</strong> {formatDate(visit.checkIn)}</p>
                                {visit.checkOut && (
                                    <p><strong>Check-out:</strong> {formatDate(visit.checkOut)}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {recentVisits.length === 0 && (
                        <p className="no-data">No recent visits</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default HostDashboard;
