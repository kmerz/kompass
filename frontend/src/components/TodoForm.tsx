import { useState } from 'react';
import Todo from '../types/Todo';

function TodoForm({
  onAdd,
}: {
  onAdd: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title.trim() == '') { return };

    onAdd(title);

    setTitle('');
  };

  return (
      <form className="todo-form" onSubmit={handleSubmit}>
        <input
	  type="text"
	  value={title}
	  onChange={(e) => setTitle(e.target.value)}
	/>
	<button type="submit">
	  Add
	</button>
      </form>
  );
}

export default TodoForm;
