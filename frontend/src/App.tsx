import { NavLink, Route, Routes } from 'react-router-dom'
import {useState, useEffect, useContext} from 'react'
import {useNavigate } from 'react-router-dom'
import TodoPage from './components/TodoPage'
import WikiPage from './components/WikiPage'
import NewPage from './components/NewPage'
import ViewPage from './components/ViewPage'
import LoginPage from './components/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import logo from "./assets/logo.png"
import AuthenticatedContext from "./context/AuthenticatedContext";
import { AuthenticatedType } from "./context/AuthenticatedContext";

import * as kompassApi from "./api/kompassApi";

import "./App.css";

export default function Home() {
  const auth = useContext<AuthenticatedType | null>(AuthenticatedContext);
  
  if (!auth) {
      return(<div className="error">No authentication state</div>)
  }
  const { isAuthenticated, setIsAuthenticated } = auth;

  const navigate = useNavigate();

  const handleLogout = async () => {
    await kompassApi.logout();
    setIsAuthenticated(false);
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
	<Route path="/" element={<ProtectedRoute><TodoPage /></ProtectedRoute>} />
        <Route path="/pages" element={<ProtectedRoute><WikiPage /></ProtectedRoute>} />
	<Route path="/pages/new" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
	<Route path="/pages/:id" element={<ProtectedRoute><ViewPage /></ProtectedRoute>} />
      </Routes>
    </div>
    </>
  );
}
