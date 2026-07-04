import TodoItem from './TodoItem';

function TodoList ({todos, onToggle, onDelete}) {
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
