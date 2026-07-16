import { createContext } from 'react'

export enum AuthState{
  loading = 0,
  autenticated,
  unauthenticated,
}

export interface AuthenticatedType {
  isAuthenticated: AuthState,
  setIsAuthenticated: (state: AuthState) => void,
}

const inititalState = {
  isAuthenticated: AuthState.loading,
  setIsAuthenticated: (_: AuthState) => {},
};
const AuthenticatedContext = createContext<AuthenticatedType | null>(null);

export default AuthenticatedContext;
