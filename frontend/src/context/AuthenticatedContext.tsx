import { createContext } from 'react'

interface AuthenticatedType {
  isAuthenticated: boolean,
  setIsAuthenticated: (boolean) => void,
}

const AuthenticatedContext = createContext<AuthenticatedType | null>(null);

export default AuthenticatedContext;
