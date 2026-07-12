import { createContext } from 'react'

export interface AuthenticatedType {
  isAuthenticated: boolean,
  setIsAuthenticated: (state: boolean) => void,
}

const AuthenticatedContext = createContext<AuthenticatedType | null>(null);

export default AuthenticatedContext;
