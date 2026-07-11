import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as kompassApi from "../api/kompassApi";
import LoginForm from "./LoginForm";

interface LoginFormProps {
  setIsAuthenticated: (bool) => void,
}
export default function LoginPage({ setIsAuthenticated }:{ LoginFormProps }) {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onLogin = async (username: string, password: string) => {
    try {
      await kompassApi.login(username, password);
      setError(null);
      setIsAuthenticated(true);
      navigate("/pages");
    } catch (err) {
      setError("Invalid username or password");
      console.log(err);
    }
  };

  return (
    <div className="login-page">
      {error && <div className="error">{error}</div>}
      <LoginForm onLogin={onLogin} />
    </div>
  );
}
