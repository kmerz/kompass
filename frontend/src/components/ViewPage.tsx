import Page from '../types/Page'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import PageForm from './PageForm';

import * as kompassApi from '../api/kompassApi';

export default function ViewPage () {
  const { id } = useParams()

  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => { loadPage(id) }, []);

  const loadPage = async (id: number) => {
    try {
      setLoading(true);
      const data = await kompassApi.getPage(id);
      data.content = await resolvePageLinks(data.content);
      setPage(data);
      setError(null);
    } catch(err) {
      setError("Error while loading page!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const PAGE_LINK_REGEX = /\$(\d+)/g;

  const resolvePageLinks = async (markdown: string): Promise<string> => {
    const matches = [...markdown.matchAll(PAGE_LINK_REGEX)];

    if (matches.length === 0) {
      return markdown;
    }

    let result = markdown;

    const ids = [...new Set(matches.map((m) => Number(m[1])))];
    const titles = new Map<number, string>();

    await Promise.all(
      ids.map(async (id) => {
        titles.set(id, await kompassApi.getTitle(id));
      })
    );

    for (const id of ids) {
      const title = titles.get(id)!;
      result = result.replaceAll(
        `$${id}`,
        `[${title}](/pages/${id})`
      );
    }

    return result;
  }

  const updatePage = async (id: number, title: string, content: string) => {
    try {
      const newPage = {
        id: id,
	title: title,
	content: content
      };
      const updated = await kompassApi.updatePage(id, newPage);
      newPage.content = await resolvePageLinks(newPage.content);
      setPage(newPage);
      setIsEdit(false);
    } catch (err) {
      setError("Error while toggling page!");
      console.log(err);
    } 
  }

  const onUpdate = async (newPage: Page) => {
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
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {page.content}
        </ReactMarkdown>
      </div>
    </div>}
    {(page && isEdit) && 
      <PageForm initialPage={page} onSubmit={onUpdate} />
      }
      
  </div>)
} 
