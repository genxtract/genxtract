import Extraction from '../Extraction.js';

const extraction = new Extraction('billiongraves');
extraction.start();

const {record, cemetery} = JSON.parse(window.atob(document.getElementById('props').textContent));

const person = record.record_id;

extraction.Person({
  id: person,
  primary: true,
});
extraction.ExternalId({
  person,
  url: window.location.href,
  id: person,
});

extraction.Name({person, name: record.fullname});

if (isAvailable(record.birth_date)) {
  extraction.Birth({person, date: record.birth_date, parents: []});
}

if (isAvailable(record.marriage_date)) {
  extraction.Marriage({spouses: [person], date: record.marriage_date});
}

if (isAvailable(record.death_date)) {
  extraction.Death({person, date: record.death_date});
}

if (cemetery) {
  const place = [
      cemetery.cemetery_name,
      cemetery.cemetery_city,
      cemetery.cemetery_county,
      cemetery.cemetery_state,
      cemetery.cemetery_country,
    ].filter((val) => val.trim() !== '').join(', ');

  extraction.Burial({person, place});
}

if(record.relationships) {
  for (const relationship of record.relationships) {
    const id = relationship.record_id;
    extraction.Person({
      id,
    });
    extraction.ExternalId({
      person: id,
      url: new URL(relationship.url, window.location).href,
      id: relationship.record_id,
    });

    extraction.Name({person: id, name: relationship.fullname});

    if (isAvailable(relationship.birth_date)) {
      extraction.Birth({person: id, date: relationship.birth_date, parents: []});
    }

    if (isAvailable(relationship.death_date)) {
      extraction.Death({person: id, date: relationship.death_date});
    }
  }
}

extraction.Citation({
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
