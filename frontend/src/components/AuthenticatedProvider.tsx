import { useState, useEffect } from 'react';
import AuthenticatedContext from '../context/AuthenticatedContext';

import * as kompassApi from "../api/kompassApi.ts";

interface AuthenticatedProviderProps {
  children: React.ReactNode,
}

const AuthenticatedProvider = ({children}: AuthenticatedProviderProps) => {
  const [isAuthenticated, setXIsAuthenticated] = useState(false);  

  const setIsAuthenticated = (state) => {
    console.log(`state: ${state}`);
    console.trace();
    setXIsAuthenticated(state);
  }

  useEffect(() => {
      async function checkAuth() {
        try {
          await kompassApi.me();
          setIsAuthenticated(true);
        } catch(err){
          setIsAuthenticated(false);
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
