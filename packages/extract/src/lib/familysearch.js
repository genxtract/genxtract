function getType(type) {
  return type.split('/').pop();
}

function process({id, data, extraction}) {
  // Persons
  if (!Array.isArray(data.persons)) {
    data.persons = [];
  }
  for (const gedcomPerson of data.persons) {
    const person = gedcomPerson.id;
    if (person === id) {
      extraction.Person({id: person, primary: true});
    } else {
      extraction.Person({id: person});
    }

    if (gedcomPerson.gender && gedcomPerson.gender.type) {
      extraction.Gender({person, gender: getType(gedcomPerson.gender.type)});
    }

    if (gedcomPerson.names) {
      for (const name of gedcomPerson.names) {
        if (name.nameForms && name.nameForms.length > 0) {
          // Just grab the first one
          const nameForm = name.nameForms[0];
          extraction.Name({person, name: nameForm.fullText});
        }
      }
    }

    if (gedcomPerson.facts) {
      for (const fact of gedcomPerson.facts) {
        const type = getType(fact.type);

        // Only extraction types we have
        if (typeof extraction[type] === 'function') {
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
          extraction[type](obj);
        }
      }
    }
  }

  // Relationships
  if (!Array.isArray(data.relationships)) {
    data.relationships = [];
  }
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

      if (typeof extraction[type] === 'function') {
        extraction[type](obj);
      }
    }
  }
  for (const child of Object.keys(births)) {
    extraction.Birth({person: child, parents: births[child]});
  }
}

export default process;
