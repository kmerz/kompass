import { NavLink, Route, Routes } from 'react-router-dom'
import TodoPage from './components/TodoPage'
import WikiPage from './components/WikiPage'
import NewPage from './components/NewPage'
import ViewPage from './components/ViewPage'
import logo from "./assets/logo.png";

import "./App.css";

export default function Home() {
  return(
  <>
    <nav className="navbar">
      <div className="navbar-title">
        <img src={logo} alt="Kompass logo" />
        <NavLink className="kompass" to="/">Kompass</NavLink>
      </div>

     <div className="navbar-links">
       <NavLink to="/">Todos</NavLink>
       <NavLink to="/pages">Pages</NavLink>
     </div>
   </nav>
    <div className="main">
      <Routes>
	<Route path="/" element={<TodoPage />} />
        <Route path="/pages" element={<WikiPage />} />
	<Route path="/pages/new" element={<NewPage />} />
	<Route path="/pages/:id" element={<ViewPage />} />
      </Routes>
    </div>
    </>
  );
}
