import React from 'react';
import { Navigate } from 'react-router';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

type Props = {
  children: React.ReactElement;
};

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
