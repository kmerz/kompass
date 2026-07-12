import Page from '../types/Page'
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import PageForm from './PageForm';

import * as kompassApi from '../api/kompassApi';

export default function ViewPage () {
  const { id } = useParams();

  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => { loadPage(id) }, []);

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

  const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  const resolvePageLinks = async (markdown: string): Promise<string> => {
    const matches = [...markdown.matchAll(WIKI_LINK_REGEX)];

    let result = markdown;

    for (const match of matches) {
      const fullMatch = match[0];
      const pageTitle = match[1];
      const label = match[2] ?? pageTitle;

      const page = await kompassApi.getPageByTitle(pageTitle);

      result = result.replace(
	  fullMatch,
	  `[${label}](/pages/${page.id})`
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

  const MdLink =({ href, children, ...rest }: {href: string, children: React.ReactNode}) => {
    const external = /^https?:\/\//.test(href);

    return (
	<>
          {external &&
            <a
              href={href}
              {...rest}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
            >
              {children}
              {external && '↗'}
            </a>}
          {!external && 
            <Link to={href}>{children}</Link>}
	</>
    );
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
