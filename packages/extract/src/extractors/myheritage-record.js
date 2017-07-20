import Extraction from '../Extraction.js';
import Emit from '../Emit.js';
import VerticalTable from '../lib/VerticalTable.js';
import HorizontalTable from '../lib/HorizontalTable.js';

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
let censusDate = null;

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
const rows = document.querySelectorAll('.recordFieldsTable:first-of-type > tbody > tr');
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
      const id = getDataItemId(value.querySelector('span'));
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
      const id = getDataItemId(value.querySelector('span'));
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
    const id = getDataItemId(value.querySelector('span'));
    emit.Person({id});
    emit.Name({person: id, name: value.textContent.trim()});
    emit.Birth({person, parents: [id]});
    emit.Gender({person: id, gender: 'Female'});
    if (!indented) {
      inScopePerson = id;
    }
  }

  if (label === 'father') {
    const id = getDataItemId(value.querySelector('span'));
    emit.Person({id});
    emit.Name({person: id, name: value.textContent.trim()});
    emit.Birth({person, parents: [id]});
    emit.Gender({person: id, gender: 'Male'});
    if (!indented) {
      inScopePerson = id;
    }
  }

  if (label === 'daughter' || label === 'daughter (implied)') {
    const id = getDataItemId(value.querySelector('span'));
    emit.Person({id});
    emit.Name({person: id, name: value.textContent.trim()});
    emit.Birth({person: id, parents: [person]});
    emit.Gender({person: id, gender: 'Female'});
    if (!indented) {
      inScopePerson = id;
    }
  }

  if (label === 'son' || label === 'son (implied)') {
    const id = getDataItemId(value.querySelector('span'));
    emit.Person({id});
    emit.Name({person: id, name: value.textContent.trim()});
    emit.Birth({person: id, parents: [person]});
    emit.Gender({person: id, gender: 'Male'});
    if (!indented) {
      inScopePerson = id;
    }
  }

  if (label === 'children' || label === 'children (implied)') {
    const children = value.querySelectorAll('span');
    for (let j = 0; j < children.length; j++) {
      const id = getDataItemId(children[j]);
      emit.Person({id});
      emit.Name({person: id, name: children[j].textContent});
      emit.Birth({person: id, parents: [person]});
    }
  }

  if (label === 'siblings' || label === 'siblings (implied)') {
    const siblings = value.querySelectorAll('span');
    for (let j = 0; j < siblings.length; j++) {
      const id = getDataItemId(siblings[j]);
      emit.Person({id});
      emit.Name({person: id, name: siblings[j].textContent});
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

  // Census table
  if(title && title.textContent.toLowerCase() === 'census') {
    const census = new HorizontalTable(additionalTable.querySelector('table'), {
      labelMapper: function(label) {
        return label.toLowerCase().replace(/:$/, '');
      },
    });
    if (census.hasMatch(/date/)) {
      censusDate = census.getMatchText(/date/).trim();
    }
  }
}

// Household table
const household = document.querySelector('.recordSection .groupTable');
if (household !== null) {
  
  const householdMembers = new VerticalTable(household, {
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

  householdMembers.getRows().forEach(function(row) {
    const relativeId = getRecordId(row.name.href);
    
    emit.Person({id: relativeId});
    emit.Name({
      person: relativeId,
      name: row.name.text,
    });

    // Update their birth date based on their age (if not set)
    if (censusDate && row.age) {
      const rawAge = row.age.text.trim();
      const year = rawAge.split(/ +/)[0];
      const age = censusDate - year;
      emit.Birth({
        person: relativeId,
        parents: [],
        date: 'About ' + age,
      });
    }

    // If we are looking at the primary person, we're done
    if (relativeId === person) return;

    // Update the gender
    const relation = row['relation to head'].text.toLowerCase();

    if (/^(wife|daughter|mother|aunt)/.test(relation)) {
      emit.Gender({
        person: relativeId,
        gender: 'Female',
      });
    } else if (/^(husband|son|father|uncle)/.test(relation)) {
      emit.Gender({
        person: relativeId,
        gender: 'Male',
      });
    }

    // Note: We have all of the relations from the main table above
  });
}

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
  const parts = url.match(/\/record-\d+-([^\/]+)\//);
  return `${parts[1]}`;
}

/**
 * Get the data-item-id value from a span
 * 
 * @param {Element} span
 * @return {String}
 */
function getDataItemId(span) {
  if(span) {
    const value = span.getAttribute('data-item-id');
    if(value) {
      return value.replace(/-$/, '');
    }
  }
}
