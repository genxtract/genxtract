import Extraction from '../Extraction.js';
import Emit from '../Emit.js';
import process from '../lib/familysearch.js';

const extraction = new Extraction('familysearch-person');
const emit = new Emit(extraction);

extraction.start();

extract()
  .then(() => extraction.end())
  .catch((error) => {
    console.error(error);
    extraction.end();
  });


async function extract() {
  const res = await fetch(window.location.href, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'accept': 'application/x-fs-v1+json',
    },
  });

  if (!res.ok) {
    throw new Error('Could not fetch person data');
  }

  const data = await res.json();

  let recordId = window.location.href.match(/[A-Z0-9-]+$/)[0];
  let id = null;
  // The primary person will have a persistent identifier matching this href
  for (const person of data.persons) {
    if (person.identifiers && person.identifiers['http://gedcomx.org/Persistent']) {
      const persistentId = person.identifiers['http://gedcomx.org/Persistent'][0];
      const personId = persistentId.match(/[A-Z0-9-]+$/)[0];
      if (recordId === personId) {
        id = person.id;
        break;
      }
    }
  }

  process({id, data, emit});

  // Citation
  emit.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'FamilySearch',
    repository_website: 'familysearch.org',
    repository_url: 'https://familysearch.org',
  });
}
