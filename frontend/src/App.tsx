import { Link, Route, Routes } from 'react-router-dom'
import TodoPage from './components/TodoPage'
import WikiPage from './components/WikiPage'
import "./App.css";

export default function Home() {
  return(
    <div className="main">
      <nav>
        <Link to="/">Wiki</Link>
        <Link to="/todos">Todos</Link> 
      </nav>
      <Routes>
        <Route path="/" element={<WikiPage />} />
	<Route path="/todos" element={<TodoPage />} />
      </Routes>
    </div>
  );
}
