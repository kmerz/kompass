import { Navigate } from "react-router-dom";
import { use } from "react";

import AuthenticatedContext from '../context/AuthenticatedContext';
import { AuthenticatedType, AuthState } from '../context/AuthenticatedContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {

  const { isAuthenticated } = use<AuthenticatedType>(AuthenticatedContext);
  if (isAuthenticated == AuthState.loading) {
    return (<div className="auth-loading">loading...</div>);
  } else if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
