import PageItem from './PageItem';
import Page from '../types/Page';

function PageList (
  {pages, onDelete}:
  {
    pages: Page[],
    onDelete: (id: number) => Promise<any>,
  }) {
  if (pages.length == 0) {
    return (
	<div> No pages found. Create one!</div>
    );
  }

  return (
      <ul className="page-list">
        {
	  pages.map(t => (
		<PageItem
		  key={t.id}
		  page={t}
		  onDelete={onDelete}
		  />
	  ))
	}
      </ul>
  );
}

export default PageList;
