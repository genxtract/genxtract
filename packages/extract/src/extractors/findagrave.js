import Extraction from '../Extraction.js';

const extraction = new Extraction('findagrave');
extraction.start();

// Person
const person = window.location.search.match(/id=(\d+)/)[1];
extraction.Person({
  id: person,
  primary: true,
});
extraction.ExternalId({
  person,
  url: window.location.href,
  id: person,
});

// Name
let name = xpath([
  '/html/body/table/tbody/tr/td[3]/table/tbody/tr[1]/td/font',
  '/html/body/table/tbody/tr/td[2]/table/tbody/tr[1]/td/font',
]);
if (name) {
  extraction.Name({person, name: name.textContent.replace('[Edit]')});
}

// Birth
const birth = extractDateOrPlace(bodyXpath(1, 2));
if (birth.place || birth.date) {
  birth.person = person;
  birth.parents = [];
  extraction.Birth(birth);
}

// Death
const death = extractDateOrPlace(bodyXpath(2, 2));
if (death.place || death.date) {
  death.person = person;
  death.parents = [];
  extraction.Death(death);
}

// Burial
const burial = bodyXpath(5, 1);
if (burial) {
  const burialPlace = [];
  for (let i = 0; i < burial.childNodes.length; i++) {
    const content = burial.childNodes[i].textContent.trim();
    if (['', 'Burial:', '[Edit]', '[Add Plot]', '[Edit Plot]']
        .includes(content)) {
      continue;
    }
    burialPlace.push(content);
  }

  if (burialPlace.length > 0) {
    extraction.Burial({person, place: burialPlace.join(', ')});
  }
}

// Family Links
const bioCell = bodyXpath(3, 1);
let inFamilyLinks = false;
let relationType = null;
for (let i = 0; i < bioCell.childNodes.length; i++) {
  const node = bioCell.childNodes[i];
  const content = node.textContent.trim();

  if (!inFamilyLinks && content.startsWith('Family links:')) {
    inFamilyLinks = true;
  }

  // Skip based on content and not in family links section
  if (['', '[Edit]', '*Calculated relationship'].includes(content) || !inFamilyLinks) {
    continue;
  }

  switch(content) {
    case 'Parent:':
    case 'Parents:':
      relationType = 'Parent';
      break;
    case 'Spouse:':
    case 'Spouses:':
      relationType = 'Spouse';
      break;
    case 'Child:':
    case 'Children:':
      relationType = 'Child';
      break;
    case 'Sibling:':
    case 'Siblings:':
      relationType = 'Sibling';
      break;
    default:
      // a and font nodes are people
      if (!['A', 'FONT'].includes(node.nodeName)) {
        break;
      }
      // Generate an id
      let id = `person-${i}`;
      if (node.href) {
        id = node.href.match(/id=(\d+)/)[1];
      }
      // Extract information
      const parts = content.match(/^([\w\s\.]+)( \((\w{4}) - (\w{4})\))?$/);
      if (!parts) {
        break;
      }
      extraction.Person({id});
      extraction.Name({person: id, name: parts[1]});
      if (parts[4]) {
        extraction.Death({person: id, date: parts[4]});
      }

      // Birth and/or marriage depending on Relationship
      switch(relationType) {
        case 'Parent':
          extraction.Birth({person: id, date: parts[3], parents: []});
          extraction.Birth({person, parents: [id]});
          break;
        case 'Spouse':
          extraction.Birth({person: id, date: parts[3], parents: []});
          extraction.Marriage({spouses: [person, id]});
          break;
        case 'Sibling':
          extraction.Birth({person: id, date: parts[3], parents: []});
          break;
        case 'Child':
          extraction.Birth({person: id, date: parts[3], parents: [person]});
          break;
      }
  }
}

extraction.Citation({
  title: document.title,
  url: window.location.href,
  accessed: Date.now(),
  repository_name: 'Find A Grave',
  repository_website: 'findagrave.com',
  repository_url: 'http://www.findagrave.com',
});

extraction.end();

/* Helper functions */

function xpath(paths) {
  for(let i = 0; i < paths.length; i++) {
    const result = document.evaluate(paths[i], document, null, window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if(result.snapshotLength) {
      return result.snapshotItem(0);
    }
  }
}

function bodyXpath(row, cell) {
  return xpath([
    `/html/body/table/tbody/tr/td[3]/table/tbody/tr[3]/td[1]/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr[${row}]/td[${cell}]`, // eslint-disable-line max-len
    `/html/body/table/tbody/tr/td[3]/table/tbody/tr[4]/td[1]/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr[${row}]/td[${cell}]`, // eslint-disable-line max-len
    `/html/body/table/tbody/tr/td[3]/table/tbody/tr[5]/td[1]/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr[${row}]/td[${cell}]`, // eslint-disable-line max-len
  ]);
}

function extractDateOrPlace(cell) {
  const result = {};

  if (cell) {
    const parts = cell.innerHTML.replace(/<a.+<\/a>/, '').trim().split('<br>');

    if(parts.length === 1) {
      if(/\d{4}/.test(parts[0])) {
        result.date = parts[0].replace(/\s+/g, ' ');
      }
    } else if(parts.length >= 2) {
      result.date = parts.shift().replace(/\s+/g, ' ');
      result.place = parts.join(', ').replace(/\s+/g, ' ');
    }
  }
  return result;
}
