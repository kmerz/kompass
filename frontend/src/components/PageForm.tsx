import { useState } from 'react';
import Page from '../types/Page';

interface PageFormProps {
  initialPage?: Page;
  onSubmit: (page: Omit<Page, 'id'>) => Promise<void>;
  submitLabel?: string;
}

function PageForm({
    initialPage,
    onSubmit,
    submitLabel = "Save",
}: PageFormProps) {
  const [title, setTitle] = useState(initialPage?.title ?? "");
  const [content, setContent] = useState(initialPage?.content ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title.trim() == '') { return };

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
	content: content
	});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <form className="page-form" onSubmit={handleSubmit}>
        <label>Title
	  <input
	    type="text"
	    value={title}
	    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTitle(e.target.value )}}
	  />
	</label>
	<label>Content
	<textarea
	  value={content}
	  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setContent(e.target.value )}}
	  />
	</label> 
	<button type="submit">
	{submitLabel}
	</button>
      </form>
  );
}

export default PageForm;
