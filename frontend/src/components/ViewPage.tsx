import Page from '../types/Page'
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import PageForm from './PageForm';
import PageRenderMarkdown from './PageRenderMarkdown';

import * as kompassApi from '../api/kompassApi';

export default function ViewPage () {
  const { id } = useParams();

  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => { loadPage(id) }, [id]);

  const loadPage = async (id: string | undefined) => {
    try {
      if (!id) {
        setError("Error loading page");
        console.error("id is undefined");
        return;
      }
      
      const parsedId = Number(id);
      if (isNaN(parsedId)) {
          setError("Id is not a number");
          return;
      }
      setLoading(true);
      const data = await kompassApi.getPage(parsedId);
      setPage(data);
      setError(null);
    } catch(err) {
      setError("Error while loading page!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePage = async (id: number, title: string, content: string) => {
    try {
      const newPage = {
        id: id,
	      title: title,
	      content: content
      };
      const updated = await kompassApi.updatePage(id, newPage);
      setPage(newPage);
      setIsEdit(false);
    } catch (err) {
      setError("Error while toggling page!");
      console.log(err);
    } 
  }

  const onUpdate = async (newPage: Omit<Page, 'id'>) => {
    if (!page) {
        setError("No page found")
        return;
    }
    return updatePage(page.id, newPage.title, newPage.content);
  };

  const onClickEdit = () => {
    setIsEdit(!isEdit);
  }

  return (
  <div className="view-page">
    {error && <div className="error">{error}</div>}
    {loading && <div className="view-loading">Loading Page</div>}
    <div className="view-edit"><button onClick={onClickEdit} aria-label="Edit page">✎</button></div>
    {(page && !isEdit) &&
      <div className="view-main">
      <h1 className="page-title">{page.title}</h1>
      <div className="page-content">
        <PageRenderMarkdown content={page.content} />
      </div>
    </div>}
    {(page && isEdit) && 
      <PageForm initialPage={page} onSubmit={onUpdate} />
      }
      
  </div>)
} 
