import Extraction from '../Extraction.js';
import process from '../lib/familysearch.js';

const extraction = new Extraction('familysearch-person');

extraction.start();

extract()
  .then(() => extraction.end())
  .catch((error) => {
    console.error(error);
    extraction.end();
  });


async function extract() {
  const id = window.location.pathname.split('/')[3];
  const res = await fetch(`/platform/tree/persons/${id}?relatives`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'accept': 'application/json',
      'X-FS-Feature-Tag': 'consolidate-redundant-resources',
    },
  });

  if (!res.ok) {
    throw new Error('Could not fetch person data');
  }

  const data = await res.json();

  process({id, data, extraction});

  // Citation
  extraction.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'FamilySearch',
    repository_website: 'familysearch.org',
    repository_url: 'https://familysearch.org',
  });
}
