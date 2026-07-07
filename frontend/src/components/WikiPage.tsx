import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';

import Page from '../types/Page';
import PageList from './PageList';
import * as kompassApi from '../api/kompassApi';


export default function WikiPage() {
  const [pages, setPages] = useState<Array<Page>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await kompassApi.getAllPages();
      setPages(data);
      setError(null);
    } catch(err) {
      setError("Error while loading pages!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePage = async (id: number, title: string, content: string) => {
    try {
      const page = pages.find(t => t.id == id);
      if (!page) {
	throw("Cannot find Page with id: " + id);
      }
      const newPage = {
	...page,
	title: title,
	content: content
      };
      const updated = await kompassApi.updatePage(id, newPage);
      setPages(pages.map(t => t.id == id ? updated : t))
    } catch (err) {
      setError("Error while toggling page!");
      console.log(err);
    } 
  }

  const deletePage = async (id: number) => {
    try {
      await kompassApi.deletePage(id);
      setPages(pages.filter(t => t.id != id));
    } catch (err) {
      setError("Error while deleting page!");
      console.log(err);
    }
  }

  return(
    <div className="wiki-main">
      <h1> Wiki </h1>
      {error && <div className="error">{error}</div>}

      <Link className="button" to="/pages/new">New Page</Link>

      <PageList 
        pages={pages}
        onDelete={deletePage}
        onUpdate={updatePage}
      />
    </div>
  );
}
