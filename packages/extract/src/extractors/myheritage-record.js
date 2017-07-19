import Extraction from '../Extraction.js';
import Emit from '../Emit.js';
import VerticalTable from '../lib/VerticalTable.js';

const extraction = new Extraction('myheritage-record');
const emit = new Emit(extraction);

const map = {
  'birth': 'Birth',
  'christening': 'Christening',
  'marriage': 'Marriage',
  'immigration': 'Immigration',
  'residence': 'Residence',
  'death': 'Death',
  'burial': 'Burial',
  'occupation': 'Occupation',
  'arrival place': 'Immigration',
};

extraction.start();

const person = getRecordId(window.location.href);
let spouse = null;

emit.Person({id: person, primary: true});

const names = document.querySelector('.recordTitle').textContent.split('&').map((val) => val.trim());
emit.Name({person, name: names[0]});

// If we have more than one name, this is a marriage, so create the spouse
if (names.length > 1) {
  spouse = `${person}-spouse`;
  emit.Person({id: spouse});
  emit.Name({person: spouse, name: names[1]});
}

// Loop through the record rows
// We have to keep track of the current "in scope" person throughout the loop
const rows = document.querySelectorAll('.recordFieldsTable > tbody > tr');
let inScopePerson = person;
let indented = false;

for (let i= 0; i < rows.length; i++) {
  const row = rows[i];
  const tds = row.querySelectorAll('td');
  const label = tds[0].textContent.toLowerCase().replace(/:$/, '').trim();
  const value = tds[1];

  indented = tds[0].querySelector('div') !== null;

  if (!indented) {
    inScopePerson = person;
  }

  if (label === 'husband') {
    if (spouse) {
      inScopePerson = (value.textContent.trim() === names[0]) ? person : spouse;
    } else {
      const id = `${person}-${i}`;
      emit.Person({id});
      emit.Name({person: id, name: value.textContent.trim()});
      emit.Marriage({spouses: [person, id]});
      emit.Gender({person: id, gender: 'Male'});
      if (!indented) {
        inScopePerson = id;
      }
    }
  }

  if (label === 'wife') {
    if (spouse) {
      inScopePerson = (value.textContent.trim() === names[0]) ? person : spouse;
    } else {
      const id = `${person}-${i}`;
      emit.Person({id});
      emit.Name({person: id, name: value.textContent.trim()});
      emit.Marriage({spouses: [person, id]});
      emit.Gender({person: id, gender: 'Female'});
      if (!indented) {
        inScopePerson = id;
      }
    }
  }

  if (label === 'mother') {
    const id = `${person}-${i}`;
    emit.Person({id});
    emit.Name({person: id, name: value.textContent.trim()});
    emit.Birth({person, parents: [id]});
    emit.Gender({person: id, gender: 'Female'});
    if (!indented) {
      inScopePerson = id;
    }
  }

  if (label === 'father') {
    const id = `${person}-${i}`;
    emit.Person({id});
    emit.Name({person: id, name: value.textContent.trim()});
    emit.Birth({person, parents: [id]});
    emit.Gender({person: id, gender: 'Male'});
    if (!indented) {
      inScopePerson = id;
    }
  }

  if (label === 'daughter' || label === 'daughter (implied)') {
    const id = `${person}-${i}`;
    emit.Person({id});
    emit.Name({person: id, name: value.textContent.trim()});
    emit.Birth({person: id, parents: [person]});
    emit.Gender({person: id, gender: 'Female'});
    if (!indented) {
      inScopePerson = id;
    }
  }

  if (label === 'son' || label === 'son (implied)') {
    const id = `${person}-${i}`;
    emit.Person({id});
    emit.Name({person: id, name: value.textContent.trim()});
    emit.Birth({person: id, parents: [person]});
    emit.Gender({person: id, gender: 'Male'});
    if (!indented) {
      inScopePerson = id;
    }
  }

  if (label === 'children' || label === 'children (implied)') {
    const rawNames = value.innerHTML;
    const names = rawNames.split(/<br ?\/?>/).map((val) => val.trim());
    for (let j = 0; j < names.length; j++) {
      const id = `${person}-${i}-${j}`;
      emit.Person({id});
      emit.Name({person: id, name: names[j]});
      emit.Birth({person: id, parents: [person]});
    }
  }

  if (label === 'siblings' || label === 'siblings (implied)') {
    const rawNames = value.innerHTML;
    const names = rawNames.split(/<br ?\/?>/).map((val) => val.trim());
    for (let j = 0; j < names.length; j++) {
      const id = `${person}-${i}-${j}`;
      emit.Person({id});
      emit.Name({person: id, name: names[j]});
    }
  }

  if (label === 'gender') {
    const gender = (value.textContent.toLowerCase()[0] === 'f') ? 'Female' : 'Male';
    emit.Gender({person: inScopePerson, gender});
  }

  // Other names
  if (label === 'birth names') {
    const rawNames = value.innerHTML;
    const names = rawNames.split(/<br ?\/?>/);
    for (const name of names) {
      emit.Name({person: inScopePerson, name});
    }
  }

  // Facts and events
  const type = map[label];
  let place = value.querySelector('.event_place .map_callout_link');
  if (!place) {
    place = value.querySelector('.event_place');
  }
  if (place) {
    place = place.textContent.trim();
  }
  let date = value.querySelector('.event_date');
  if (date) {
    date = date.textContent.trim();
  }
  switch(type) {
    case 'Christening':
    case 'Immigration':
    case 'Residence':
    case 'Death':
    case 'Burial':
      emit[type]({person: inScopePerson, date, place});
      break;
    case 'Occupation':
    case 'Immigration':
      emit[type]({person: inScopePerson, date, place, value: value.textContent.trim()});
      break;
    case 'Birth':
      emit[type]({person: inScopePerson, date, place, parents: []});
      break;
    case 'Marriage':
      if (spouse) {
        emit[type]({date, place, spouses: [person, spouse]});
      }
      break;
  }
}

// Additional tables
const tables = document.querySelectorAll('.recordFieldsTable');
for(let i = 0; i < tables.length; i++) {
  if(i === 0) continue;

  let additionalTable = tables[i];
  let title = additionalTable.querySelector('.recordSectionTitle');

  // Relatives table
  if(title && title.textContent.toLowerCase() === 'relatives') {
    
    const relatives = new VerticalTable(additionalTable.querySelector('table'), {
      labelMapper: function(label) {
        return label.toLowerCase().trim();
      },
      valueMapper: function(cell) {
        const a = cell.querySelector('a');
        return {
          text: cell.textContent.trim(),
          href: a ? a.href : '',
        };
      },
    });
    
    relatives.getRows().forEach((row) => {
      
      // If there is no relation, return
      if (!row.relation.text.trim()) return;

      const relativeId = getRecordId(row.name.href);
      const relation = row.relation.text.toLowerCase();

      emit.Person({id: relativeId});
      emit.Name({
        person: relativeId,
        name: row.name.text,
      });

      // Update their birth/death information
      if (row.birth && row.birth.text) {
        emit.Birth({
          person: relativeId,
          parents: [],
          date: row.birth.text.trim(),
        });
      }
      if (row.death && row.death.text) {
        emit.Death({
          person: relativeId,
          date: row.death.text.trim(),
        });
      }

      // Add relationships
      if(/^(husband|wife)/.test(relation)) {
        emit.Marriage({
          spouses: [person, relativeId],
        });
      } else if(/^(son|daughter)/.test(relation)) {
        emit.Birth({
          parents: [person],
          person: relativeId,
        });
      } else if(/^(mother|father)/.test(relation)) {
        emit.Birth({
          parents: [relativeId],
          person: person,
        });
      }

      // Gender
      if(/^(husband|son|father)/.test(relation)) {
        emit.Gender({
          person: relativeId,
          gender: 'Male',
        });
      } else if(/^(wife|daughter|mother)/.test(relation)) {
        emit.Gender({
          person: relativeId,
          gender: 'Female',
        });
      }
    });
  }
}

// TODO: household table

emit.Citation({
  title: document.title,
  url: window.location.href,
  accessed: Date.now(),
  repository_name: 'MyHeritage',
  repository_website: 'myheritage.com',
  repository_url: 'https://www.myheritage.com',
});

extraction.end();

/**
 * Extract the record ID from a record URL
 * 
 * @param {String} url
 * @return {String}
 */
function getRecordId(url) {
  const parts = url.match(/\/record-(\d+)-([^\/]+)\//);
  return `${parts[1]}-${parts[2]}`;
}
