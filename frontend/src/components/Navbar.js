import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Check if a path is active
    const isActive = (path) => location.pathname === path;

    const renderAuthLinks = () => {
        if (!user) {
            return (
                <>
                    <Link 
                        to="/login" 
                        className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                    >
                        Login
                    </Link>
                    <Link 
                        to="/register" 
                        className={`nav-link ${isActive('/register') ? 'active' : ''}`}
                    >
                        Register
                    </Link>
                </>
            );
        }

        if (user.role === 'host') {
            return (
                <>
                    <Link 
                        to="/host-dashboard" 
                        className={`nav-link ${isActive('/host-dashboard') ? 'active' : ''}`}
                    >
                        Dashboard
                    </Link>
                    <Link 
                        to="/see-requests" 
                        className={`nav-link ${isActive('/see-requests') ? 'active' : ''}`}
                    >
                        Requests
                    </Link>
                    <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">Host</span>
                        {user.department && (
                            <span className="user-department">{user.department}</span>
                        )}
                    </div>
                </>
            );
        }

        if (user.role === 'visitor') {
            return (
                <>
                    <Link
                        to="/visitor-dashboard"
                        className={`nav-link ${isActive('/visitor-dashboard') ? 'active' : ''}`}
                    >
                        My Passes
                    </Link>
                    <Link
                        to="/create-request"
                        className={`nav-link ${isActive('/create-request') ? 'active' : ''}`}
                    >
                        Create Request
                    </Link>
                    <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">Visitor</span>
                    </div>
                </>
            );
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    Visitor Management
                </Link>

                <div className="navbar-links">
                    {renderAuthLinks()}
                    {user && (
                        <button 
                            onClick={handleLogout}
                            className="nav-link logout-btn"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .navbar {
                    background-color: #fff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    padding: 1rem 0;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .navbar-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .navbar-brand {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #333;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .navbar-brand:hover {
                    color: #007bff;
                }

                .navbar-links {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .nav-link {
                    color: #666;
                    text-decoration: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .nav-link:hover {
                    color: #007bff;
                    background-color: #f8f9fa;
                }

                .nav-link.active {
                    color: #007bff;
                    background-color: #e7f1ff;
                }

                .logout-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1rem;
                    padding: 8px 12px;
                    color: #dc3545;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .logout-btn:hover {
                    background-color: #dc3545;
                    color: white;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    padding: 0 15px;
                    border-left: 1px solid #eee;
                }

                .user-name {
                    color: #333;
                    font-weight: 500;
                }

                .user-role {
                    color: #666;
                    font-size: 0.8rem;
                    background: #e7f1ff;
                    padding: 2px 8px;
                    border-radius: 12px;
                    margin-top: 4px;
                }

                .user-department {
                    color: #666;
                    font-size: 0.8rem;
                    font-style: italic;
                    margin-top: 4px;
                }

                @media (max-width: 768px) {
                    .navbar-container {
                        flex-direction: column;
                        gap: 1rem;
                        padding: 10px;
                    }

                    .navbar-links {
                        flex-direction: column;
                        width: 100%;
                    }

                    .nav-link {
                        width: 100%;
                        text-align: center;
                    }

                    .user-info {
                        align-items: center;
                        border-left: none;
                        border-top: 1px solid #eee;
                        padding: 10px 0;
                        margin-top: 10px;
                    }

                    .logout-btn {
                        width: 100%;
                        margin-top: 10px;
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
