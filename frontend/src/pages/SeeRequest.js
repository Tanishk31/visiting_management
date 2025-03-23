import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { visitors, handleApiError } from "../utils/api";
import { formatDate, getStatusColorClass, groupVisitsByDate } from "../utils/helpers";
import "../styles/hostDashboard.css";

const SeeRequest = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all"); // all, pending, approved, denied
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (!user || user.role !== 'host') {
            navigate('/login');
            return;
        }
        fetchVisits();
    }, [user, navigate]);

    const fetchVisits = async () => {
        try {
            setLoading(true);
            setError("");
            
            const response = await visitors.getHostRequests();
            setVisits(response.data);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (visitId, newStatus) => {
        try {
            await visitors.approveVisit(visitId, newStatus);
            fetchVisits(); // Refresh the list
            // Show success message
            const message = newStatus === 'approved' ? 'Request approved' : 'Request denied';
            alert(message);
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const handleDateRangeChange = async () => {
        try {
            const response = await visitors.getVisitsByDateRange(
                dateRange.startDate, 
                dateRange.endDate
            );
            setVisits(response.data);
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    // Filter visits based on status
    const filteredVisits = visits.filter(visit => 
        filter === 'all' ? true : visit.status === filter
    );

    // Group visits by date
    const groupedVisits = groupVisitsByDate(filteredVisits);

    if (loading) {
        return <div className="loading">Loading requests...</div>;
    }

    return (
        <div className="dashboard-container">
            <h2>Visitor Requests</h2>
            
            {error && (
                <div className="alert alert-error">
                    <p>{error}</p>
                    <button onClick={() => setError("")} className="btn-close">×</button>
                </div>
            )}

            <div className="filters-section">
                <div className="status-filter">
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Requests</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                    </select>
                </div>

                <div className="date-filter">
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({
                            ...dateRange,
                            startDate: e.target.value
                        })}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({
                            ...dateRange,
                            endDate: e.target.value
                        })}
                    />
                    <button 
                        onClick={handleDateRangeChange}
                        className="btn btn-secondary"
                    >
                        Apply Filter
                    </button>
                </div>
            </div>

            {Object.entries(groupedVisits).map(([date, dateVisits]) => (
                <div key={date} className="date-group">
                    <h3 className="date-header">{formatDate(date, false)}</h3>
                    <div className="requests-grid">
                        {dateVisits.map((visit) => (
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
                                                onClick={() => handleStatusChange(visit._id, 'approved')}
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
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {filteredVisits.length === 0 && (
                <div className="no-requests">
                    <p>No requests found for the selected filters.</p>
                </div>
            )}
        </div>
    );
};

export default SeeRequest;
