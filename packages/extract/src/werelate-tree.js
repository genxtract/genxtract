import Extraction from '../lib/Extraction.js';
import Emit from '../lib/Emit.js';

const extraction = new Extraction('werelate-tree');
const emit = new Emit(extraction);

extraction.start();

const person = getId(window.location.href);

emit.person({
  id: person,
  primary: true,
});

const factsTable = document.querySelector('.wr-infotable-factsevents');

const facts = factsTable.querySelectorAll('tbody tr');

for (let i = 0; i < facts.length; i++) {
  const fact = facts[i];
  const typeNode = fact.querySelector('span.wr-infotable-type');
  if (!typeNode) {
    extraction.error('could not get type for facts table');
  }
  const type = typeNode.textContent.trim().toLowerCase();

  switch(type) {
    case 'name':
      emit.name({
        person,
        name: fact.querySelector('span.wr-infotable-fullname').textContent,
      });
      break;
    case 'gender':
      emit.gender({
        person,
        gender: fact.querySelector('span.wr-infotable-gender').textContent,
      });
      break;
    case 'birth':
      emit.birth({
        person,
        date: getDate(fact),
        place: getPlace(fact),
      });
      break;
    case 'marriage':
      const persons = [person];
      const node = fact.querySelector('.wr-infotable-placedesc span.wr-infotable-desc');
      if (node) {
        // TODO check if this starts with "to"
        const a = node.querySelector('a');
        persons.push(getId(a.href));
      }
      emit.marriage({
        persons,
        date: getDate(fact),
        place: getPlace(fact),
      });
      break;
    case 'death':
      emit.death({
        person,
        date: getDate(fact),
        place: getPlace(fact),
      });
      break;
  }
}

extraction.end();

/* Helper functions */

function getId(href) {
  const url = new URL(href, window.location);
  return decodeURI(url.pathname.split(':')[1]);
}

function getDate(elem) {
  const node = elem.querySelector('span.wr-infotable-date');
  if (!node) {
    return undefined;
  }
  return node.textContent.trim();
}

function getPlace(elem) {
  const node = elem.querySelector('span.wr-infotable-place');
  if (!node) {
    return undefined;
  }
  return node.textContent.trim();
}
