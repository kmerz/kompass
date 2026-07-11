import { NavLink, Route, Routes } from 'react-router-dom'
import {useState, useEffect} from 'react'
import {useNavigate } from 'react-router-dom'
import TodoPage from './components/TodoPage'
import WikiPage from './components/WikiPage'
import NewPage from './components/NewPage'
import ViewPage from './components/ViewPage'
import LoginPage from './components/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import logo from "./assets/logo.png"

import * as kompassApi from "./api/kompassApi";

import "./App.css";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
      console.log("useEffect");
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

  const navigate = useNavigate();

  const handleLogout = async () => {
    await kompassApi.logout();
    navigate("/login");
  };

  return(
  <>
    <nav className="navbar">
      <div className="navbar-title">
        <img src={logo} alt="Kompass logo" />
        <NavLink className="kompass" to="/">Kompass</NavLink>
      </div>

     <div className="navbar-links">
      
       {isAuthenticated &&
       <>
         <NavLink to="/">Todos</NavLink>
         <NavLink to="/pages">Pages</NavLink>
         <button className="logout" onClick={handleLogout}>
           Logout
         </button>
       </>}
     </div>
   </nav>
    <div className="main">
      <Routes>
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
	<Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated}><TodoPage /></ProtectedRoute>} />
        <Route path="/pages" element={<ProtectedRoute isAuthenticated={isAuthenticated}><WikiPage /></ProtectedRoute>} />
	<Route path="/pages/new" element={<ProtectedRoute isAuthenticated={isAuthenticated}><NewPage /></ProtectedRoute>} />
	<Route path="/pages/:id" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ViewPage /></ProtectedRoute>} />
      </Routes>
    </div>
    </>
  );
}
