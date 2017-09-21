import Extraction from '../Extraction.js';

const extraction = new Extraction('genealogieonline');
extraction.start();

const persons = Array.from(document.querySelectorAll('[itemtype="http://schema.org/Person"]'));

const mainPerson = persons.shift(); // We assume the first person is the main person
const mainName = mainPerson.querySelector('h3');
const mainFacts = mainPerson.querySelector('.nicelist');


const person = getId(window.location.href);
extraction.Person({id: person, primary: true});
const name = getContent('name', mainName);

if (name) {
  extraction.Name({person, name});
}

const birthPlace = getContent(['birthPlace', 'address', 'addressLocality'], mainFacts);
const birthDate = getContent('birthDate', mainFacts);
if (birthPlace || birthDate) {
  extraction.Birth({person, place: birthPlace, date: birthDate, parents: []});
}

const deathPlace = getContent(['deathPlace', 'address', 'addressLocality'], mainFacts);
const deathDate = getContent('deathDate', mainFacts);
if (deathPlace || deathDate) {
  extraction.Death({person, place: deathPlace, date: deathDate});
}

const parents = [];
for (const rawPerson of persons) {
  const id = getId(getContent('url', rawPerson));
  const name = getContent('name', rawPerson);
  const birthPlace = getContent(['birthPlace', 'address', 'addressLocality'], rawPerson);
  const birthDate = getContent('birthDate', rawPerson);
  const deathPlace = getContent(['deathPlace', 'address', 'addressLocality'], rawPerson);
  const deathDate = getContent('deathDate', rawPerson);

  extraction.Person({id});
  if (name) {
    extraction.Name({person: id, name});
  }
  if (deathPlace || deathDate) {
    extraction.Death({person: id, place: deathPlace, date: deathDate});
  }

  switch(rawPerson.getAttribute('itemprop')) {
    case 'parent':
      parents.push(id);
      if (birthPlace || birthDate) {
        extraction.Birth({person: id, place: birthPlace, date: birthDate, parents: []});
      }
      break;
    case 'spouse':
      extraction.Marriage({spouses: [person, id]});
      break;
    case 'children':
      extraction.Birth({person: id, place: birthPlace, date: birthDate, parents: [person]});
      break;
  }
}

if (parents.length > 0) {
  extraction.Birth({person, parents});
}

extraction.Citation({
  title: document.title,
  url: window.location.href,
  accessed: Date.now(),
  repository_name: 'genealogieonline',
  repository_website: 'genealogieonline.nl',
  repository_url: 'https://www.genealogieonline.nl',
});

extraction.end();

/* Helper functions */

function getId(url) {
  return url.split('/').pop().split('.').shift();
}

function getContent(props, elem) {
  if (!Array.isArray(props)) {
    props = [props];
  }
  for (const prop of props) {
    const node = elem.querySelector(`[itemprop="${prop}"]`);
    if (node !== null && node.getAttribute('content') !== null) {
      return node.getAttribute('content');
    }
  }

  return undefined;
}
