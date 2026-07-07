import {useState, useEffect} from 'react';
import TodoList from './TodoList';
import TodoForm from './TodoForm';
import * as todoApi from '../api/todoApi';
import Todo from './types/Todo';

export default function TodoPage() {
  const [todos, setTodos] = useState<Array<Todo>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await todoApi.getAllTodos();
      setTodos(data);
      setError(null);
    } catch(err) {
      setError("Error while loading todos!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (title: string) => {
    try {
      const newTodo = await todoApi.createTodo(title);
      setTodos([...todos, newTodo]);
      setError(null);
    } catch (err) {
      setError("Error while createing todo!");
      console.error(err);
    }
  }

  const toggleTodo = async (id: number) => {
    try {
      const todo = todos.find(t => t.id == id);
      if (!todo) {
	throw("Cannot find Todo with id: " + id);
      }
      const newTodo = {
	...todo,
	completed: !todo.completed
      };
      const updated = await todoApi.updateTodo(id, newTodo);
      setTodos(todos.map(t => t.id == id ? updated : t))
    } catch (err) {
      setError("Error while toggling todo!");
      console.log(err);
    } 
  }

  const deleteTodo = async (id: number) => {
    try {
      await todoApi.deleteTodo(id);
      setTodos(todos.filter(t => t.id != id));
    } catch (err) {
      setError("Error while deleting todo!");
      console.log(err);
    }
  }

  if (loading) {
    return (<div> Loading Todos from Server! </div>)
  }

  return(
      <div className="todo-main">
      <h1>Todos</h1>

      {error && <div className="error">{error}</div>}

      <TodoForm onAdd={addTodo} />

      <TodoList 
      todos={todos}
      onDelete={deleteTodo}
      onToggle={toggleTodo}
      />

      <div className="footer">
      {todos.filter(t => !t.completed).length} of {todos.length} open
      </div>
    </div>
  );
}
