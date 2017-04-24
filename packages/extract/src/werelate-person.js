import Extraction from '../lib/Extraction.js';
import Emit from '../lib/Emit.js';

const extraction = new Extraction('werelate-person');
const emit = new Emit(extraction);

const basicEvents = {
  'alt burial': 'Burial',
  'alt christening': 'Christening',
  'alt death': 'Death',
  'baptism': 'Baptism',
  'bar mitzvah': 'BarMitzvah',
  'Blessing': 'Blessing',
  'burial': 'Burial',
  'christening': 'Christening',
  'confirmation': 'Confirmation',
  'cremation': 'Cremation',
  'death': 'Death',
  'excommunication': 'Excommunication',
  'first communion': 'FirstCommunion',
  'funeral': 'Funeral',
  'ordination': 'Ordination',
};

const basicFacts = {
  'caste': 'Caste',
  'citizenship': 'Citizenship',
  'degree': 'Education',
  'education': 'Education',
  'emigration': 'Emigration',
  'employment': 'Occupation',
  'graduation': 'Education',
  'immigration': 'Immigration',
  'nationality': 'Nationality',
  'naturalization': 'Naturalization',
  'occupation': 'Occupation',
};

const parentEvents = {
  'adoption': 'Adoption',
  'birth': 'Birth',
};

extraction.start();

const person = getId(window.location.href);

emit.Person({
  id: person,
  primary: true,
});
emit.ExternalId({
  person,
  url: window.location.href,
  id: person,
});

/* Main facts table */

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
      emit.Name({
        person,
        name: fact.querySelector('span.wr-infotable-fullname').textContent.trim(),
      });
      break;
    case 'gender':
      emit.Gender({
        person,
        gender: fact.querySelector('span.wr-infotable-gender').textContent.trim(),
      });
      break;
    case 'marriage':
      const spouses = [person];
      const node = fact.querySelector('.wr-infotable-placedesc span.wr-infotable-desc');
      if (node && node.textContent.startsWith('to ')) {
        const a = node.querySelector('a');
        const url = new URL(a.href, window.location);
        const id = getId(url.href);
        emitPerson({
          id,
          name: a.textContent.trim(),
          url: url.href,
        });
        spouses.push(getId(a.href));
      }
      emit.Marriage({
        spouses,
        date: getDate(fact),
        place: getPlace(fact),
      });
      break;
    default:
      if (basicEvents[type]) {
        emit[basicEvents[type]]({
          person,
          date: getDate(fact),
          place: getPlace(fact),
        });
      }
      if (basicFacts[type]) {
        emit[basicFacts[type]]({
          person,
          date: getDate(fact),
          place: getPlace(fact),
          value: getDesc(fact),
        });
      }
      if (parentEvents[type]) {
        emit[parentEvents[type]]({
          person,
          date: getDate(fact),
          place: getPlace(fact),
          parents: [], // We don't have any parents here
        });
      }
  }
}

/* Parents and Siblings */
const parentsAndSiblings = document.querySelector('.wr-infobox-parentssiblings');

// Parents
const parents = parentsAndSiblings.querySelectorAll('ul li');
const parentIds = [];
for (let i = 0; i < parents.length; i++) {
  const parent = parents[i];
  const label = parent.querySelector('.wr-infobox-label').textContent.trim().toLowerCase();
  const a = parent.querySelector('a');
  const yearRange = parent.querySelector('.wr-infobox-yearrange').textContent.trim();
  const years = yearRange.split(' - ');
  const url = new URL(a.href, window.location);
  const id = getId(url.href);
  emitPerson({
    id,
    name: a.textContent.trim(),
    url: url.href,
    gender: (label == 'f') ? 'Male' : 'Female',
    birth: (years.length === 2) ? years[0] : undefined,
    death: (years.length === 2) ? years[1] : undefined,
  });
  parentIds.push(id);
}
// Emit marriage
const parentMarriageDate = parentsAndSiblings.querySelector('.wr-infobox-event .wr-infobox-date');
if (parentMarriageDate) {
  emit.Marriage({
    spouses: parentIds,
    date: parentMarriageDate.textContent.trim(),
  });
}
// Emit a birth event if we have parents
if (parentIds.length > 0) {
  emit.Birth({
    person,
    parents: parentIds,
  });
}

// Siblings
const siblings = parentsAndSiblings.querySelectorAll('ol li');
for (let i = 0; i < siblings.length; i++) {
  const sibling = siblings[i];
  const a = sibling.querySelector('a');
  // If there is no link, it's the person, so skip
  if (a === null) {
    continue;
  }
  const yearRange = sibling.querySelector('.wr-infobox-yearrange').textContent.trim();
  const years = yearRange.split(' - ');
  const url = new URL(a.href, window.location);
  const id = getId(url.href);
  emitPerson({
    id,
    name: a.textContent.trim(),
    url: url.href,
    death: (years.length === 2) ? years[1].trim() : undefined,
  });
  emit.Birth({
    person: id,
    parents: parentIds,
    date: (years.length === 2) ? years[0].trim() : undefined,
  });
}

/* Spouse and Children */
const spouseAndChildren = document.querySelector('.wr-infobox-spousechildren');

// Spouse
const spouses = spouseAndChildren.querySelectorAll('ul li');
const spouseIds = [person];
for (let i = 0; i < spouses.length; i++) {
  const spouse = spouses[i];
  const label = spouse.querySelector('.wr-infobox-label').textContent.trim().toLowerCase();
  const a = spouse.querySelector('a');
  // If there is no link, it's the person, so skip
  if (a === null) {
    continue;
  }
  const yearRange = spouse.querySelector('.wr-infobox-yearrange').textContent.trim();
  const years = yearRange.split(' - ');
  const url = new URL(a.href, window.location);
  const id = getId(url.href);
  emitPerson({
    id,
    name: a.textContent.trim(),
    url: url.href,
    gender: (label == 'h') ? 'Male' : 'Female',
    birth: (years.length === 2) ? years[0] : undefined,
    death: (years.length === 2) ? years[1] : undefined,
  });
  spouseIds.push(id);
}
// Emit marriage
const marriageDate = spouseAndChildren.querySelector('.wr-infobox-event .wr-infobox-date');
if (marriageDate) {
  emit.Marriage({
    spouses: spouseIds,
    date: marriageDate.textContent.trim(),
  });
}


// Children
const children = spouseAndChildren.querySelectorAll('ol li');
for (let i = 0; i < children.length; i++) {
  const child = children[i];
  const a = child.querySelector('a');
  const yearRange = child.querySelector('.wr-infobox-yearrange').textContent.trim();
  const years = yearRange.split(' - ');
  const url = new URL(a.href, window.location);
  const id = getId(url.href);
  emitPerson({
    id,
    name: a.textContent.trim(),
    url: url.href,
    death: (years.length === 2) ? years[1].trim() : undefined,
  });
  emit.Birth({
    person: id,
    parents: spouseIds,
    date: (years.length === 2) ? years[0].trim() : undefined,
  });
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

function getDesc(elem) {
  const node = elem.querySelector('span.wr-infotable-desc');
  if (!node) {
    return undefined;
  }
  return node.textContent.trim();
}

function emitPerson({id, name, url, gender, birth, death}) {
  emit.Person({
    id,
  });
  emit.Name({
    person: id,
    name,
  });
  emit.ExternalId({
    person: id,
    url: url,
    id,
  });
  if (gender) {
    emit.Gender({
      person: id,
      gender,
    });
  }
  if (birth && birth.trim()) {
    emit.Birth({
      person: id,
      date: birth.trim(),
      parents: [],
    });
  }
  if (death && death.trim()) {
    emit.Death({
      person: id,
      date: death.trim(),
      parents: [],
    });
  }
}
