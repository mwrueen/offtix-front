import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { state } = useAuth();
  const location = useLocation();

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="p-5 text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 m-0">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;