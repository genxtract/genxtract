import Extraction from '../Extraction.js';
import Emit from '../Emit.js';

const eventMappings = [
  {
    regex: /^christening$/,
    type: 'Christening',
  },
  {
    regex: /^immigration$/,
    type: 'Immigration',
  },
  {
    regex: /^residence$/,
    type: 'Residence',
  },
  {
    regex: /^death$/,
    type: 'Death',
  },
  {
    regex: /^burial$/,
    type: 'Burial',
  },
];

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
  const personMatches = window.location.hash.match(/profile-([0-9]+)-/);
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
  
  personId = `${treeId}-${personId}`;

  emit.Person({
    id: personId,
    primary: true,
  });
  emit.Name({
    person: personId,
    name: pageHtml.querySelector('#BreadcrumbsFinalText').textContent,
  });

  // Get events
  let events = eventHtml.querySelectorAll('.EventRow');

  for (let i = 0; i < events.length; i++) {
    const event = events[i].querySelector('.EventsText');
    const parts = event.querySelectorAll('.FL_Label');
    const type = parts[0];
    const typeText = type.textContent.toLowerCase();
    let place = '';
    let date = '';

    if (parts.length == 2) {
      place = parts[1].textContent;
    }
    if (parts.length == 3) {
      place = parts[1].textContent;
      date = parts[2].textContent;
    }

    // Handle basic event types
    eventMappings.forEach((mapping) => {
      if (typeText.match(mapping.regex)) {
        emit[mapping.type]({
          person: personId,
          date: date.trim(),
          place: place.trim(),
        });
      }
    });

    // Handle Birth
    if (typeText.match(/^birth$/)) {
      emit.Birth({
        person: personId,
        date: date.trim(),
        place: place.trim(),
        parents: [],
      });
    }

    // Handle Marriage
    if (typeText.match(/^marriage to/)) {
      const aTag = type.querySelector('a');
      const spouseId = getRecordId(aTag.href);
      emit.Person({
        id: spouseId,
      });
      emit.Name({
        person: spouseId,
        name: aTag.textContent.trim(),
      });
      emit.Marriage({
        spouses: [personId, spouseId],
      });
    }

    /*

    // Handle Daughter
    if (typeText.match(/^birth of daughter/)) {
      var aTag = type.querySelector('a');
      var person = new GedcomX.Person({
        id: getRecordId(aTag.href),
        identifiers: {
          'genscrape': getRecordIdentifier(aTag.href),
        },
      });
      person.addSimpleName(aTag.textContent.trim());
      person.setGender({
        type: 'http://gedcomx.org/Female',
      });
      gedx.addPerson(person);
      gedx.addRelationship({
        type: 'http://gedcomx.org/ParentChild',
        person1: primaryPerson,
        person2: person,
      });
    }

    // Handle Son
    if (typeText.match(/^birth of son/)) {
      var aTag = type.querySelector('a');
      var person = new GedcomX.Person({
        id: getRecordId(aTag.href),
        identifiers: {
          'genscrape': getRecordIdentifier(aTag.href),
        },
      });
      person.addSimpleName(aTag.textContent.trim());
      person.setGender({
        type: 'http://gedcomx.org/Male',
      });
      gedx.addPerson(person);
      gedx.addRelationship({
        type: 'http://gedcomx.org/ParentChild',
        person1: primaryPerson,
        person2: person,
      });
    }

    */

  }

  /*

  // Get immediate family section
  // There is no identifiers for this table, so get the first table under the h2
  let h2s = $page.querySelectorAll('h2');
  for (var i = 0; i < h2s.length; i++) {
    if (h2s[i].textContent.toLowerCase().trim() === 'immediate family') {
      let table = h2s[i].nextSibling;
      let tds = table.querySelectorAll('td');
      for (let j = 0; j < tds.length; j++) {
        let td = tds[j];
        // Skip empty tds
        if (td.textContent.trim() === '') continue;
        var aTag = td.querySelector('a');
        let rel = td.querySelector('span').textContent.trim();

        // Mother
        if (rel.toLowerCase() == 'his mother') {
          var person = new GedcomX.Person({
            id: getRecordId(aTag.href),
            identifiers: {
              'genscrape': getRecordIdentifier(aTag.href),
            },
          });
          person.addSimpleName(aTag.textContent.trim());
          person.setGender({
            type: 'http://gedcomx.org/Female',
          });
          gedx.addPerson(person);
          gedx.addRelationship({
            type: 'http://gedcomx.org/ParentChild',
            person1: person,
            person2: primaryPerson,
          });
        }

        // Father
        if (rel.toLowerCase() == 'his father') {
          var person = new GedcomX.Person({
            id: getRecordId(aTag.href),
            identifiers: {
              'genscrape': getRecordIdentifier(aTag.href),
            },
          });
          person.addSimpleName(aTag.textContent.trim());
          person.setGender({
            type: 'http://gedcomx.org/Male',
          });
          gedx.addPerson(person);
          gedx.addRelationship({
            type: 'http://gedcomx.org/ParentChild',
            person1: person,
            person2: primaryPerson,
          });
        }
      }
    }
  }

  */

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

function getRecordId(url) {
  const matches = url.match(/\/person-([0-9]+)_([0-9]+)_([0-9]+)\//);
  return matches[2] + '-' + matches[1];
}
