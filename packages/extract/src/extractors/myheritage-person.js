import Extraction from '../Extraction.js';
import {parseHtml} from '../lib/utils.js';

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

if(window.location.href.indexOf('myheritage.com/person-') !== -1) {
  const matches = window.location.pathname.match(/\/person-([0-9]+)_([0-9]+)_([0-9]+)\//);
  const personId = matches[1];
  const treeId = matches[2];
  run(extraction, treeId, personId);
} else if(window.location.href.indexOf('myheritage.com/site-family-tree-') !== -1) {
  const treeMatches = window.location.pathname.match(/\/site-family-tree-([0-9]+)\//);
  const treeId = treeMatches[1];
  const personMatches = window.location.hash.match(/profile-([0-9]+)-/);
  const personId = personMatches[1];
  run(extraction, treeId, personId);
}

function run(extraction, treeId, personId) {
  extraction.start();
  extract(extraction, treeId, personId)
    .then(() => extraction.end())
    .catch((error) => {
      console.error(error);
      extraction.end();
    });
}

async function extract(extraction, treeId, personId) {

  const pageUrl = `/FP/API/Profile/get-profile-tab-content.php?s=${treeId}&siteID=${treeId}&indID=${personId}&show=info&inCanvas=1&getPart=main`;
  const eventUrl = `/FP/API/Profile/get-profile-tab-content.php?s=${treeId}&siteID=${treeId}&indID=${personId}&show=events&inCanvas=0&getPart=tab`;

  const pageHtml = await getHtml(pageUrl);
  const eventHtml = await getHtml(eventUrl);

  process(extraction, treeId, personId, pageHtml, eventHtml);
}

function process(extraction, treeId, personId, pageHtml, eventHtml) {
  
  personId = `${treeId}-${personId}`;

  extraction.Person({
    id: personId,
    primary: true,
  });
  emitNames(extraction, personId, pageHtml.querySelector('#BreadcrumbsFinalText').textContent);
  
  // There is no identifying text for the gender. The best we can see
  // is to examine the profile silhouette which is determined by a CSS class
  const silhouette = pageHtml.querySelector('#profileSilhouetteContainer .PK_Silhouette');
  if(silhouette.classList.contains('PK_Silhouette_S_192_M_A_LTR')) {
    extraction.Gender({
      person: personId,
      gender: 'Male',
    });
  } else if(silhouette.classList.contains('PK_Silhouette_S_192_F_A_LTR')) {
    extraction.Gender({
      person: personId,
      gender: 'Female',
    });
  }

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
      place = parts[1].textContent.trim();
    }
    if (parts.length == 3) {
      place = parts[1].textContent.trim();
      date = parts[2].textContent.trim();
    }

    // Handle basic event types
    eventMappings.forEach((mapping) => {
      if (typeText.match(mapping.regex)) {
        extraction[mapping.type]({
          person: personId,
          date: date,
          place: place,
        });
      }
    });

    // Handle Birth
    if (typeText.match(/^birth$/)) {
      extraction.Birth({
        person: personId,
        date: date,
        place: place,
        parents: [],
      });
    }

    // Handle Marriage
    if (typeText.match(/^marriage to/)) {
      const aTag = type.querySelector('a');
      const spouseId = getRecordId(aTag.href);
      extraction.Person({
        id: spouseId,
      });
      emitNames(extraction, spouseId, aTag.textContent.trim());
      extraction.Marriage({
        spouses: [personId, spouseId],
      });
    }

    // TODO: can we assume that the previously seen spouse
    // is the parent of all succeeding children?

    // Handle Daughter
    if (typeText.match(/^birth of daughter/)) {
      const aTag = type.querySelector('a');
      const daughterId = getRecordId(aTag.href);
      extraction.Person({
        id: daughterId,
      });
      emitNames(extraction, daughterId, aTag.textContent.trim());
      extraction.Gender({
        person: daughterId,
        gender: 'Female',
      });
      extraction.Birth({
        person: daughterId,
        date: date,
        place: place,
        parents: [personId],
      });
    }

    // Handle Son
    if (typeText.match(/^birth of son/)) {
      const aTag = type.querySelector('a');
      const sonId = getRecordId(aTag.href);
      extraction.Person({
        id: sonId,
      });
      extraction.Name({
        person: sonId,
        name: aTag.textContent.trim(),
      });
      extraction.Gender({
        person: sonId,
        gender: 'Male',
      });
      extraction.Birth({
        person: sonId,
        date: date,
        place: place,
        parents: [personId],
      });
    }

  }

  // Get immediate family section.
  // Here we only grab the parents because we already got the spouse and
  // children from the events table.
  // There are no identifiers for this table, so get the first table under the h2
  let h2s = pageHtml.querySelectorAll('h2');
  for (let i = 0; i < h2s.length; i++) {
    if (h2s[i].textContent.toLowerCase().trim() === 'immediate family') {
      let table = h2s[i].nextSibling;
      let tds = table.querySelectorAll('td');
      for (let j = 0; j < tds.length; j++) {
        let td = tds[j];
        // Skip empty tds
        if (td.textContent.trim() === '') continue;
        let aTag = td.querySelector('a');
        let rel = td.querySelector('span').textContent.toLowerCase().trim();

        // Mother
        if (/^(his|her) mother/.test(rel)) {
          const motherId = getRecordId(aTag.href);
          extraction.Person({
            id: motherId,
          });
          emitNames(extraction, motherId, aTag.textContent.trim());
          extraction.Gender({
            person: motherId,
            gender: 'Female',
          });
          extraction.Birth({
            person: personId,
            parents: [motherId],
          });
        }

        // Father
        if (/^(his|her) father/.test(rel)) {
          const fatherId = getRecordId(aTag.href);
          extraction.Person({
            id: fatherId,
          });
          extraction.Name({
            person: fatherId,
            name: aTag.textContent.trim(),
          });
          extraction.Gender({
            person: fatherId,
            gender: 'Male',
          });
          extraction.Birth({
            person: personId,
            parents: [fatherId],
          });
        }
      }
    }
  }

  extraction.Citation({
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

/**
 * The purpose of this function is to handle the parsing of femail names
 * which may have their maiden name specified in () such as "Sarah Smith (born Thompson)"
 * 
 * @param {Object} extraction 
 * @param {string} person 
 * @param {string} name 
 */
function emitNames(extraction, person, name) {
  const pieces = name.split(/ \((born )?/);
  
  // Single name
  if(pieces.length === 1) {
    extraction.Name({
      person,
      name,
    });
  } else {
    
    // Here we have a female name with the maiden name in parenthesis
    // so we split up the name into pieces and emit both the married
    // name and the maiden name.
    const marriedName = pieces[0];
    const maidenName = pieces[2].replace(')', '');
    const nameParts = marriedName.split(' ');
    const marriedSurname = nameParts.pop();
    const given = nameParts.join(' ');

    extraction.Name({
      person,
      name: marriedName,
      given,
      surname: marriedSurname,
    });
    extraction.Name({
      person,
      name: `${given} ${maidenName}`,
      given,
      surname: maidenName,
    });
  }
}

function getRecordId(url) {
  const matches = url.match(/\/person-([0-9]+)_([0-9]+)_([0-9]+)\//);
  return matches[2] + '-' + matches[1];
}
