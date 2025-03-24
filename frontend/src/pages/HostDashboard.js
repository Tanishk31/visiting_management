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
        const initialize = async () => {
            try {
                // Wait for auth to be initialized
                if (authLoading) {
                    return;
                }

                // Check if authenticated
                if (!user) {
                    console.log('No user found, redirecting to login');
                    navigate('/login');
                    return;
                }

                // Verify user role from token
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found, redirecting to login');
                    navigate('/login');
                    return;
                }

                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (!payload.role || payload.role !== 'host') {
                        console.log('Invalid role in token:', payload.role);
                        navigate('/login');
                        return;
                    }
                } catch (err) {
                    console.error('Error parsing token:', err);
                    navigate('/login');
                    return;
                }

                // Role is verified, fetch dashboard data
                await fetchDashboardData();
            } catch (err) {
                console.error('Dashboard initialization error:', err);
                setError('Failed to initialize dashboard. Please try logging in again.');
                navigate('/login');
            }
        };

        initialize();
    }, [user, authLoading, navigate]);

    const fetchDashboardData = async () => {
        // Don't fetch if not authenticated
        if (!user || user.role !== 'host') {
            console.log('Not authorized to fetch data');
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError("");

            console.log('Fetching active visits...');
            const activeResponse = await visitors.getActiveVisits();
            
            if (!activeResponse?.data) {
                throw new Error('Invalid response for active visits');
            }
            
            setActiveVisits(activeResponse.data);
            console.log('Active visits fetched:', activeResponse.data.length);

            console.log('Fetching all visits...');
            const allVisits = await visitors.getHostRequests();
            
            if (!allVisits?.data) {
                throw new Error('Invalid response for host requests');
            }
            
            const visits = allVisits.data;
            console.log('All visits fetched:', visits.length);

            // Calculate stats with validation
            // Group visits by status and calculate stats
            const statistics = visits.reduce((acc, visit) => {
                if (!visit || !visit.status) {
                    console.warn('Invalid visit data:', visit);
                    return acc;
                }
                acc.total++;
                
                // Map the status to our stat categories
                switch (visit.status) {
                    case 'pending':
                        acc.pending++;
                        break;
                    case 'approved':
                        acc.approved++;
                        break;
                    case 'denied':
                        acc.denied++;
                        break;
                    case 'completed':
                        acc.checkedOut++;
                        break;
                    default:
                        console.warn('Unknown status:', visit.status);
                }
                return acc;
            }, {
                total: 0,
                pending: 0,
                approved: 0,
                denied: 0,
                checkedOut: 0
            });

            // Set pending requests to be shown in active visits
            const pendingRequests = visits.filter(visit => visit.status === 'pending');
            setActiveVisits(prevVisits => {
                const uniqueVisits = [...pendingRequests, ...prevVisits];
                return [...new Set(uniqueVisits.map(v => v._id))].map(id =>
                    uniqueVisits.find(v => v._id === id)
                );
            });

            setStats(statistics);
            console.log('Stats calculated:', statistics);

            // Get recent visits (last 5) with validation
            const recentVisitsData = visits
                .filter(visit => visit && visit.checkIn) // Only include valid visits
                .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
                .slice(0, 5);
            
            setRecentVisits(recentVisitsData);
            console.log('Recent visits set:', recentVisitsData.length);

        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            
            // Handle authentication errors
            if (err.response?.status === 401) {
                console.log('Auth error in dashboard, redirecting to login');
                navigate('/login');
            }
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
