import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';

// Citizen Portal Pages
import PublicMap from './pages/Citizen/PublicMap';
import FileComplaint from './pages/Citizen/FileComplaint';
import TrackComplaint from './pages/Citizen/TrackComplaint';

// Utility Portal Pages
import UtilityDashboard from './pages/Utility/Dashboard';
import ApplyPermit from './pages/Utility/ApplyPermit';
import PermitTracker from './pages/Utility/PermitTracker';

// Admin Portal Pages
import AdminDashboard from './pages/Admin/Dashboard';
import PermitApprovals from './pages/Admin/PermitApprovals';
import ConflictManager from './pages/Admin/ConflictManager';
import ComplaintsList from './pages/Admin/ComplaintsList';
import RestorationVerification from './pages/Admin/RestorationVerification';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0F766E]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect standard roles if not permitted
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'UTILITY') return <Navigate to="/utility" replace />;
    return <Navigate to="/citizen" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Citizen map doesn't require login */}
          <Route path="/" element={<Navigate to="/citizen" replace />} />
          <Route path="/citizen" element={
            <Layout>
              <PublicMap />
            </Layout>
          } />
          <Route path="/citizen/report" element={
            <Layout>
              <FileComplaint />
            </Layout>
          } />
          <Route path="/citizen/track" element={
            <Layout>
              <TrackComplaint />
            </Layout>
          } />

          {/* Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Utility Portal Routes */}
          <Route path="/utility" element={
            <ProtectedRoute allowedRoles={['UTILITY']}>
              <Layout>
                <UtilityDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/utility/apply" element={
            <ProtectedRoute allowedRoles={['UTILITY']}>
              <Layout>
                <ApplyPermit />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Portal (GHMC) Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/permits" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout>
                <PermitApprovals />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/verifications" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout>
                <RestorationVerification />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/conflicts" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout>
                <ConflictManager />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/complaints" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout>
                <ComplaintsList />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Shared Permit Tracker Route */}
          <Route path="/tracker" element={
            <ProtectedRoute allowedRoles={['UTILITY', 'ADMIN']}>
              <Layout>
                <PermitTracker />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/citizen" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
