import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import PageForm from './PageForm';
import Page from '../types/Page';

import * as kompassApi from '../api/kompassApi';

export default function NewPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  const addPage = async (title: string, content: string) => {
    try {
      const newPage = await kompassApi.createPage(title, content);
      setError(null);
      navigate(`/pages/${newPage.id}`);
    } catch (err) {
      setError("Error while createing page!");
      console.error(err);
    }
  }

  return(
    <div className="wiki-main">
      <h1> Wiki </h1>
      {error && <div className="error">{error}</div>}

      <PageForm 
        onSubmit={async (page: Page) => addPage(page.title, page.content)}
	submitLabel="Create"
      />
    </div>
  );
}
