import Extraction from '../Extraction.js';
import Emit from '../Emit.js';

const extraction = new Extraction('billiongraves');
const emit = new Emit(extraction);

extraction.start();

const {record, cemetery} = JSON.parse(window.atob(document.getElementById('props').textContent));

const person = record.record_id;

emit.Person({
  id: person,
  primary: true,
});
emit.ExternalId({
  person,
  url: window.location.href,
  id: person,
});

emit.Name({person, name: record.fullname});

if (isAvailable(record.birth_date)) {
  emit.Birth({person, date: record.birth_date, parents: []});
}

if (isAvailable(record.marriage_date)) {
  emit.Marriage({spouses: [person], date: record.marriage_date});
}

if (isAvailable(record.death_date)) {
  emit.Death({person, date: record.death_date});
}

if (cemetery) {
  const place = [
      cemetery.cemetery_name,
      cemetery.cemetery_city,
      cemetery.cemetery_county,
      cemetery.cemetery_state,
      cemetery.cemetery_country,
    ].filter((val) => val.trim() !== '').join(', ');

  emit.Burial({person, place});
}

for (const relationship of record.relationships) {
  const id = relationship.record_id;
  emit.Person({
    id,
  });
  emit.ExternalId({
    person: id,
    url: new URL(relationship.url, window.location).href,
    id: relationship.record_id,
  });

  emit.Name({person: id, name: relationship.fullname});

  if (isAvailable(relationship.birth_date)) {
    emit.Birth({person: id, date: relationship.birth_date, parents: []});
  }

  if (isAvailable(relationship.death_date)) {
    emit.Death({person: id, date: relationship.death_date});
  }
}

emit.Citation({
  title: document.title,
  url: window.location.href,
  accessed: Date.now(),
  repository_name: 'Billion Graves',
  repository_website: 'billiongraves.com',
  repository_url: 'http://billiongraves.com',
});

extraction.end();

/* Helper functions */

function isAvailable(text) {
  return text !== 'Not Available';
}
