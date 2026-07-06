import Todo from '../types/Todo';

function TodoItem(
  { todo, onToggle, onDelete }:
  {
    todo: Todo,
    onToggle: (id: number) => Promise<void>,
    onDelete: (id: number) => Promise<void>,
  }) {
  return (
      <li className={`todo-item ${todo.completed ? "completed" : ""}`}>
        <input
	  type="checkbox"
	  checked={todo.completed}
	  onChange={() => onToggle(todo.id)}
	  />
	<span>{todo.title}</span>
	<button
	  onClick={() => onDelete(todo.id)}
	  aria-label="Delete todo"
	  >x
        </button>
      </li>
  );
}

export default TodoItem;
