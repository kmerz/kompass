import TodoItem from './TodoItem';
import Todo from '../types/Todo';

function TodoList (
  {todos, onToggle, onDelete}:
  {
    todos: Todo[],
    onToggle: (id: number) => Promise<void>,
    onDelete: (id: number) => Promise<any>,
  }) {
  if (todos.length == 0) {
    return (
	<div> No tods found. Create one!</div>
    );
  }

  return (
      <ul className="todo-list">
        {
	  todos.map(t => (
		<TodoItem
		  key={t.id}
		  todo={t}
		  onToggle={onToggle}
		  onDelete={onDelete}
		  />
	  ))
	}
      </ul>
  );
}

export default TodoList;
