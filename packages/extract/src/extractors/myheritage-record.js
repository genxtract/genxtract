import Extraction from '../Extraction.js';
import Emit from '../Emit.js';

const extraction = new Extraction('familysearch-person');
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

const person = window.location.pathname.split('/')[2].split('-').splice(1, 2).join('-');
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

emit.Citation({
  title: document.title,
  url: window.location.href,
  accessed: Date.now(),
  repository_name: 'MyHeritage',
  repository_website: 'myheritage.com',
  repository_url: 'https://www.myheritage.com',
});

extraction.end();
