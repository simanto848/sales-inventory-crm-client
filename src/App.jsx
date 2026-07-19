import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Branches from './pages/Branches';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import CreateSale from './pages/CreateSale';
import Employees from './pages/Employees';
import Sidebar from './components/Sidebar';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const PublicLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          } />
          <Route path="/products" element={
            <ProtectedLayout>
              <Products />
            </ProtectedLayout>
          } />
          <Route path="/branches" element={
            <ProtectedLayout>
              <Branches />
            </ProtectedLayout>
          } />
          <Route path="/customers" element={
            <ProtectedLayout>
              <Customers />
            </ProtectedLayout>
          } />
          <Route path="/sales" element={
            <ProtectedLayout>
              <Sales />
            </ProtectedLayout>
          } />
          <Route path="/sales/create" element={
            <ProtectedLayout>
              <CreateSale />
            </ProtectedLayout>
          } />
          <Route path="/employees" element={
            <ProtectedLayout>
              <Employees />
            </ProtectedLayout>
          } />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
