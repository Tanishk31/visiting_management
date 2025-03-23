import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CreateRequest from "./pages/CreateRequest";
import HostDashboard from "./pages/HostDashboard";
import VisitorDashboard from "./pages/VisitorDashboard";
import SeeRequest from "./pages/SeeRequest";
import "./styles/global.css";

// Protected Route Component
const ProtectedRoute = ({ element: Element, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Only redirect if user is definitely not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate page based on user's role
    if (user.role === 'host') {
      return <Navigate to="/host-dashboard" replace />;
    } else if (user.role === 'visitor') {
      return <Navigate to="/create-request" replace />;
    }
    // If role is invalid, logout
    return <Navigate to="/login" replace />;
  }

  return <Element />;
};

// Role-based Route Handler
const RoleBasedRoute = () => {
  const { user, loading } = useAuth();

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Check user authentication and role
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  if (user.role === 'host') {
    return <Navigate to="/host-dashboard" replace />;
  }

  if (user.role === 'visitor') {
    return <Navigate to="/create-request" replace />;
  }

  // Invalid role, redirect to login
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              {/* Host Routes */}
              <Route 
                path="/host-dashboard" 
                element={
                  <ProtectedRoute 
                    element={HostDashboard} 
                    allowedRoles={['host']} 
                  />
                } 
              />
              <Route 
                path="/see-requests" 
                element={
                  <ProtectedRoute 
                    element={SeeRequest} 
                    allowedRoles={['host']} 
                  />
                } 
              />

              {/* Visitor Routes */}
              <Route
                path="/visitor-dashboard"
                element={
                  <ProtectedRoute
                    element={VisitorDashboard}
                    allowedRoles={['visitor']}
                  />
                }
              />
              <Route
                path="/create-request"
                element={
                  <ProtectedRoute
                    element={CreateRequest}
                    allowedRoles={['visitor']}
                  />
                }
              />

              {/* Default Route - Role Based */}
              <Route path="/" element={<RoleBasedRoute />} />

              {/* 404 Route */}
              <Route 
                path="*" 
                element={
                  <div className="not-found">
                    <h2>404 - Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                  </div>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
