import Extraction from '../Extraction.js';
import Emit from '../Emit.js';

const extraction = new Extraction('myheritage-person');
const emit = new Emit(extraction);

if(window.location.href.indexOf('myheritage.com/person-') !== -1) {
  const matches = window.location.pathname.match(/\/person-([0-9]+)_([0-9]+)_([0-9]+)\//);
  const personId = matches[1];
  const treeId = matches[2];
  run(emit, treeId, personId);
} else if(window.location.href.indexOf('myheritage.com/site-family-tree-') !== -1) {
  const treeMatches = window.location.pathname.match(/\/site-family-tree-([0-9]+)\//);
  const treeId = treeMatches[1];
  const personMatches = window.location.hash.match(/profile-([0-9]+)-info/);
  const personId = personMatches[1];
  run(emit, treeId, personId);
}

function run(emit, treeId, personId) {
  extraction.start();
  extract(emit, treeId, personId)
    .then(() => extraction.end())
    .catch((error) => {
      console.error(error);
      extraction.end();
    });
}

async function extract(emit, treeId, personId) {

  const pageUrl = `/FP/API/Profile/get-profile-tab-content.php?s=${treeId}&siteID=${treeId}&indID=${personId}&show=info&inCanvas=1&getPart=main`;
  const eventUrl = `/FP/API/Profile/get-profile-tab-content.php?s=${treeId}&siteID=${treeId}&indID=${personId}&show=events&inCanvas=0&getPart=tab`;

  const pageHtml = await getHtml(pageUrl);
  const eventHtml = await getHtml(eventUrl);

  process(emit, treeId, personId, pageHtml, eventHtml);
}

function process(emit, treeId, personId, pageHtml, eventHtml) {
  console.log(arguments);
  
  emit.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'MyHeritage',
    repository_website: 'myheritage.com',
    repository_url: 'https://www.myheritage.com',
  });
}

async function getHtml(url) {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Error fetching ${url}`);
  }
  const text = await res.text();
  return parseHtml(text);
}

function parseHtml(html) {
  const div = window.document.createElement('div');
  div.innerHTML = html;
  return div;
}
