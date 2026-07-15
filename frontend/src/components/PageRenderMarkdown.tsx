import { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Page from "../types/Page";

import * as kompassApi from '../api/kompassApi';

interface PageRenderMarkdownProps {
  content: string,
}

interface NewPage {
  id: "new",
  title: string,
  content: string,
}

type PageCache = Map<string, Page | NewPage>;

const PageRenderMarkdown = ({ content }: PageRenderMarkdownProps) => {
const [displayedContent, setDisplayedContent] = useState<string>("");

  useEffect(() => {
    const loadContent = async () => {
    const newContent = await resolvePageLinks(content);
      setDisplayedContent(newContent);
    };

    loadContent();
  }, [content]);

  const [pageCache, setPageCache] = useState<PageCache>(new Map()); 
 
  const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  const resolvePageLinks = async (markdown: string): Promise<string> => {
    const matches = [...markdown.matchAll(WIKI_LINK_REGEX)];

    let result = markdown;
    let page: Page | NewPage;

    for (const match of matches) {
      const fullMatch = match[0];
      const pageTitle = match[1];
      const label = match[2] ?? pageTitle;

      if (pageCache.has(pageTitle)) {
          const result = pageCache.get(pageTitle);
          if (result != undefined) {
            page = result as Page;
          } else {
            page = { id: "new", title: pageTitle, content: "" } as NewPage;
          }
      } else {
        try {
          page = await kompassApi.getPageByTitle(pageTitle);
        } catch(err) {
          page = { id: "new", title: pageTitle, content: "" } as NewPage;
        }
        setPageCache((prev) => {
          const next = new Map(prev);
          next.set(page.title, page);
          return next;
        });
      }

      result = result.replace(
	      fullMatch, `[${label}](/pages/${page.id})`
	    );
    }

    return result;
  }

  return (
    <div className="page-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedContent}
      </ReactMarkdown>
    </div>
  )
}

export default PageRenderMarkdown;
