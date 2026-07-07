import Page from '../types/Page'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import * as kompassApi from '../api/kompassApi';

export default function ViewPage () {
  const { id } = useParams()

  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadPage(id) }, []);

  const loadPage = async (id: number) => {
    try {
      setLoading(true);
      const data = await kompassApi.getPage(id);
      setPage(data);
      setError(null);
    } catch(err) {
      setError("Error while loading page!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="view-page">
    {error && <div className="error">{error}</div>}
    {loading && <div className="view-loading">Loading Page</div>}
    {page &&
      <div className="view-main">
      <h1 className="page-title">{page.title}</h1>
      <div className="page-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {page.content}
        </ReactMarkdown>
      </div>
    </div>}
  </div>)
} 
