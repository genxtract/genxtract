import Extraction from '../Extraction.js';
import Emit from '../Emit.js';

const extraction = new Extraction('familysearch-person');
const emit = new Emit(extraction);

extraction.start();

extract()
  .then(() => extraction.end())
  .catch((error) => {
    console.error(error);
    extraction.end();
  });


async function extract() {
  const id = window.location.pathname.split('/')[3];
  const res = await fetch(`/platform/tree/persons/${id}?relatives`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'accept': 'application/json',
      'X-FS-Feature-Tag': 'consolidate-redundant-resources',
    },
  });

  if (!res.ok) {
    throw new Error('Could not fetch person data');
  }

  const data = await res.json();

  // Persons
  for (const gedcomPerson of data.persons) {
    const person = gedcomPerson.id;
    if (person === id) {
      emit.Person({id: person, primary: true});
    } else {
      emit.Person({id: person});
    }

    if (gedcomPerson.gender && gedcomPerson.gender.type) {
      emit.Gender({person, gender: getType(gedcomPerson.gender.type)});
    }

    if (gedcomPerson.names) {
      for (const name of gedcomPerson.names) {
        if (name.nameForms && name.nameForms.length > 0) {
          // Just grab the first one
          const nameForm = name.nameForms[0];
          emit.Name({person, name: nameForm.fullText});
        }
      }
    }

    if (gedcomPerson.facts) {
      for (const fact of gedcomPerson.facts) {
        const type = getType(fact.type);

        // Only emit types we have
        if (typeof emit[type] === 'function') {
          const obj = {person};
          if (fact.date && fact.date.original) {
            obj.date = fact.date.original;
          }
          if (fact.place && fact.place.original) {
            obj.place = fact.place.original;
          }
          if (fact.value) {
            obj.value = fact.value;
          }

          if (['Adoption', 'Birth'].includes(type)) {
            obj.parents = [];
          }
          emit[type](obj);
        }
      }
    }
  }

  // Relationships
  const births = {};
  for (const relationship of data.relationships) {
    const relType = getType(relationship.type);

    if (relType === 'ParentChild') {
      const parent = relationship.person1.resourceId;
      const child = relationship.person2.resourceId;
      if (births[child] === undefined) {
        births[child] = [];
      }
      births[child].push(parent);
    }

    if (relType === 'Couple') {
      const obj = {spouses: []};

      // Get type
      let type = 'Marriage'; // Default to marriage
      if (relationship.facts && relationship.facts.length > 0) {
        // Grab the first one
        const fact = relationship.facts[0];
        type = getType(fact.type);

        // Get date and place if set
        if (fact.date && fact.date.original) {
          obj.date = fact.date.original;
        }
        if (fact.place && fact.place.original) {
          obj.place = fact.place.original;
        }
      }
      // Get spouses
      if (relationship.person1) {
        obj.spouses.push(relationship.person1.resourceId);
      }
      if (relationship.person2) {
        obj.spouses.push(relationship.person2.resourceId);
      }

      if (typeof emit[type] === 'function') {
        emit[type](obj);
      }
    }
  }
  for (const child of Object.keys(births)) {
    emit.Birth({person: child, parents: births[child]});
  }

  // Citation
  emit.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'FamilySearch',
    repository_website: 'familysearch.org',
    repository_url: 'https://familysearch.org',
  });
}

function getType(type) {
  return type.split('/').pop();
}
