import { Navigate } from "react-router-dom";
import { use } from "react";

import AuthenticatedContext from '../context/AuthenticatedContext';
import { AuthenticatedType } from '../context/AuthenticatedContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {

  const { isAuthenticated } = use<AuthenticatedType>(AuthenticatedContext);
  console.log(`isAuthenticated in ProtectedRoutePage: ${isAuthenticated}`);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
