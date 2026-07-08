import Page from '../types/Page'
import {Link} from 'react-router-dom'

function PageItem(
  { page, onUpdate, onDelete }:
  {
    page: Page,
    onUpdate: (id: number, title: string, content: string) => Promise<void>,
    onDelete: (id: number) => Promise<void>,
  }) {
  return (
      <li className={`page-item`}>
        <Link to={`/pages/${page.id}`}>
	  {page.title}
        </Link>
	<button
	  onClick={() => onDelete(page.id)}
	  aria-label="Delete page"
	  >🗑
        </button>
      </li>
  );
}

export default PageItem;
