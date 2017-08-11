import Extraction from '../Extraction.js';
import Emit from '../Emit.js';

const extraction = new Extraction('findmypast-person');
const emit = new Emit(extraction);

const urlParts = window.location.hash.split('/');
const treeId = urlParts[2];
// We convert the personId into an integer so that we can do strict comparisons
// on the response data from the API.
const personId = parseInt(urlParts[3], 10);

if(personId) {
  extraction.start();
  getRelations(treeId, personId)
    .then((data) => {
      if(data && data.Object) {
        processData(treeId, personId, data.Object);
      }
      extraction.end();
    })
    .catch((error) => {
      console.error(error);
      extraction.end();
    });
}

/**
 * 
 * @param {String} treeId 
 * @param {Integer} personId 
 * @param {Object} data 
 */
function processData(treeId, personId, data) {

  emit.Person({
    id: personId,
    primary: true,
  });
  emit.ExternalId({
    person: personId,
    url: window.location.href,
    id: personId,
  });

  console.log(data);

  emit.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'findmypast',
    repository_website: window.location.hostname,
    repository_url: window.location.origin,
  });
}

/**
 * 
 * @param {String} treeId 
 * @param {Integer} personId
 * @return {Promise}
 */
function getRelations(treeId, personId) {
  return api(treeId, 'api/familytree/getfamilytree?familytreeview=ProfileRelations&personId=' + personId);
}

/**
 * Issue an API Request
 * 
 * @param {String} treeId
 * @param {String} url
 * @return {Object}
 */
async function api(treeId, url) {
  const response = await fetch('/api/proxy/get?url=' + encodeURIComponent(url), {
    credentials: 'include',
    headers: new Headers({
      'Family-Tree-Ref': treeId,
    }),
  });
  if(response.ok) {
    return await response.json();
  }
}
