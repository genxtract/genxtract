import Extraction from '../Extraction.js';
import Emit from '../Emit.js';
import {parseHtml} from '../lib/utils.js';

const extraction = new Extraction('ancestry-person');
const emit = new Emit(extraction);

extraction.start();
run()
  .then(() => extraction.end())
  .catch((error) => {
    console.error(error);
    extraction.end();
  });

async function run() {

  // We start on a url such as https://www.ancestry.com/family-tree/person/tree/109528628/person/180077026601/facts.
  // We want to strip anything after the second number and replace it with /content/factsbody
  const factsUrl = window.location.pathname.split('/').slice(0,7).join('/') + '/content/factsbody';

  const res = await fetch(factsUrl);
  if(!res.ok) {
    throw new Error(`Error featching ${factsUrl}`);
  }

  const json = await res.json();
  if(json.HasError) {
    throw new Error(json.ErrorMessage);
  }
  if(!json.html.body) {
    throw new Error('No HTML body');
  }

  process(parseHtml(json.html.body));

  emit.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'Ancestry Public Trees',
    repository_website: 'www.ancestry.com',
    repository_url: 'https://www.ancestry.com',
  });

}

function process(html) {
  console.log(html);
}
