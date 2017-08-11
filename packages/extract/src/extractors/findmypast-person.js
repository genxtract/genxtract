import Extraction from '../Extraction.js';
import Emit from '../Emit.js';

const extraction = new Extraction('findmypast-person');
const emit = new Emit(extraction);

const urlParts = window.location.hash.split('/');
const treeId = urlParts[2];
// We convert the personId into an integer so that we can do strict comparisons
// on the response data from the API.
const personId = parseInt(urlParts[3], 10);

if(personId) {
  extraction.start();
  getRelations(treeId, personId)
    .then((data) => {
      if(data && data.Object) {
        processData(treeId, personId, data.Object);
      }
      extraction.end();
    })
    .catch((error) => {
      console.error(error);
      extraction.end();
    });
}

/**
 * 
 * @param {String} treeId 
 * @param {Integer} personId 
 * @param {Object} data 
 */
function processData(treeId, personId, data) {

  emit.Person({
    id: personId,
    primary: true,
  });
  emit.ExternalId({
    person: personId,
    url: window.location.href,
    id: personId,
  });

  const relations = new Relations(data);

  // Emit persons
  relations.getPersons().forEach((person) => {
    const personId = person.Id;
    emit.Name({
      person: personId,
      given: person.GivenNames,
      surname: person.Surnames,
    });
    if(person.BirthDate || person.BirthPlace) {
      emit.Birth({
        person: personId,
        date: convertDate(person.BirthDate),
        place: person.BirthPlace,
      });
    }
    if(person.DeathDate || person.DeathPlace) {
      emit.Death({
        person: personId,
        date: convertDate(person.DeathDate),
        place: person.DeathPlace,
      });
    }
  });

  // Spouses and Children
  relations.getFamilies(personId).forEach((family) => {
    const spouseId = family.FatherId === personId ? family.MotherId : family.FatherId;
    const spouses = [personId, spouseId];
    const marriage = {
      spouses,
    };
    if(family.MarriageDate) {
      marriage.date = convertDate(family.MarriageDate);
    }
    if(family.MarriagePlace) {
      marriage.place = family.MarriagePlace;
    }
    emit.Marriage(marriage);
    relations.getChildren(family.Id).forEach((child) => {
      emit.Birth({
        person: child.ChildId,
        parents: spouses,
      });
    });
  });

  // Parents and Siblings
  relations.getChildRefs(personId).map((child) => {
    return relations.getFamily(child.FamilyId);
  }).forEach((family) => {
    const parents = [];
    if(family.FatherId) {
      parents.push(family.FatherId);
    }
    if(family.MotherId) {
      parents.push(family.MotherId);
    }
    if(parents.length === 2) {
      emit.Marriage({
        spouses: parents,
      });
    }
    emit.Birth({
      person: personId,
      parents,
    });
    relations.getChildren(family.Id).forEach((child) => {
      emit.Birth({
        person: child.ChildId,
        parents,
      });
    });
  });

  emit.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'findmypast',
    repository_website: window.location.hostname,
    repository_url: window.location.origin,
  });
}

/**
 * Convert a findmypast date integer of form 19260504
 * into a date string of form 1926-05-04.
 * 
 * @param {Integer} dateInt
 * @return {String}
 */
function convertDate(dateInt) {
  if(dateInt) {
    const dateString = '' + dateInt;
    const year = dateString.substr(0, 4);
    const month = dateString.substr(4, 2);
    const day = dateString.substr(6, 2);
    if(month === '00' || day === '00') {
      return year;
    } else {
      return `${year}-${month}-${day}`;
    }
  }
}

/**
 * 
 * @param {String} treeId 
 * @param {Integer} personId
 * @return {Promise}
 */
function getRelations(treeId, personId) {
  return api(treeId, 'api/familytree/getfamilytree?familytreeview=ProfileRelations&personId=' + personId);
}

/**
 * Issue an API Request
 * 
 * @param {String} treeId
 * @param {String} url
 * @return {Object}
 */
async function api(treeId, url) {
  const response = await fetch('/api/proxy/get?url=' + encodeURIComponent(url), {
    credentials: 'include',
    headers: new Headers({
      'Family-Tree-Ref': treeId,
    }),
  });
  if(response.ok) {
    return await response.json();
  }
}

/**
 * Class that simplifies access of ProfileRelations API response data
 */
class Relations {
  
  constructor(data) {
    this.data = data;
  }

  getPersons() {
    return this.data.Persons;
  }

  getFamily(familyId) {
    return this.data.Familys.find(function(family) {
      return family.Id === familyId;
    });
  }

  getFamilies(personId) {
    return this.data.Familys.filter(function(family) {
      return family.FatherId === personId || family.MotherId === personId;
    });
  }

  getChildren(familyId) {
    return this.data.Childs.filter(function(child) {
      return child.FamilyId === familyId;
    });
  }

  getChildRefs(personId) {
    return this.data.Childs.filter(function(child) {
      return child.ChildId === personId;
    });
  }

}
