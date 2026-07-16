import { useState, useEffect } from 'react';
import AuthenticatedContext from '../context/AuthenticatedContext';
import { AuthState } from '../context/AuthenticatedContext';

import * as kompassApi from "../api/kompassApi";

interface AuthenticatedProviderProps {
  children: React.ReactNode,
}

const AuthenticatedProvider = ({children}: AuthenticatedProviderProps) => {
  const [isAuthenticated, setXIsAuthenticated] = useState(AuthState.loading);  

  const setIsAuthenticated = (state: AuthState) => {
    console.log(`state: ${state}`);
    console.trace();
    setXIsAuthenticated(state);
  };

  useEffect(() => {
      async function checkAuth() {
        try {
          await kompassApi.me();
          setIsAuthenticated(AuthState.autenticated);
        } catch(err){
          setIsAuthenticated(AuthState.unauthenticated);
        }
      }

      checkAuth();
  }, []);

  return (
    <AuthenticatedContext value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthenticatedContext>
  );
};

export default AuthenticatedProvider;
