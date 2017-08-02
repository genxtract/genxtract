import Combinator from '@genxtract/combinator';

class GedcomX extends Combinator {
  constructor(args = {}) {
    super(args);

    // Represents the constructed GEDCOM X data
    this._model = {};

    // And index to the persons, keyed by person ID
    this._personsIndex = {};
  }

  // Update our internal model
  dataCallback({type, data}) {
    switch(type) {
      case 'Person':
        return this.person(data);
      case 'Gender':
        return this.gender(data);
      case 'Name':
        return this.name(data);
      case 'Baptism':
      case 'BarMitzvah':
      case 'Blessing':
      case 'Burial':
      case 'Christening':
      case 'Confirmation':
      case 'Cremation':
      case 'Death':
      case 'Excommunication':
      case 'FirstCommunion':
      case 'Funeral':
      case 'Stillbirth':
      case 'Caste':
      case 'Citizenship':
      case 'Education':
      case 'Ethnicity':
      case 'Emmigration':
      case 'Immigration':
      case 'MaritalStatus':
      case 'Mission':
      case 'Nationality':
      case 'NationalId':
      case 'Naturalization':
      case 'Occupation':
      case 'Ordination':
      case 'Race':
      case 'Residence':
        return this.fact(type, data);
      case 'Adoption':
      case 'Birth':
        return this.parent(type, data);
      case 'Annulment':
      case 'Divorce':
      case 'Marriage':
      case 'Separation':
        return this.spouse(type, data);
      case 'Citation':
        return this.citation(data);
      case 'AlternateId':
        return this.alternateId(data);
      default:
        // TODO silently ignore?
        console.log(`Unknown: ${type}`, data);
    }
  }

  // (Optional) Finalize
  finalizeCallback() {
    // If we have a sourceDescription, reference it
    if (this._model.sourceDescriptions &&
       this._model.sourceDescriptions.length > 0) {
      this._model.description = '#1';

      if (this._model.persons) {
        for (let i = 0; i < this._model.persons.length; i++) {
          this._model.persons[i].sources = [{
            description: '#1',
          }];
        }
      }

      if (this._model.relationships) {
        for (let i = 0; i < this._model.relationships.length; i++) {
          this._model.relationships[i].sources = [{
            description: '#1',
          }];
        }
      }
    }
  }

  // Serialize our model
  serializeCallback() {
    return this._model;
  }

  person({id, primary}) {
    
    // Create the list of persons if it doesn't already exist
    if (this._model.persons === undefined) {
      this._model.persons = [];
    }

    // Check to see if the person has already been created
    let person = this._personsIndex[id];

    // Create the person if they don't already exist
    if(!person) {
      person = {id};
      if (primary) {
        person.principle = true;
      }
      this._model.persons.push(person);
      this._personsIndex[id] = person;
    }

    return person;
  }

  alternateId({person, id, preferred}) {
    const p = this.person({id: person});
    this._personsIndex[id] = p;
    if(preferred) {
      p.id = id;
    }
  }

  gender({person, gender}) {
    const p = this.person({id: person});
    p.gender = {
      type: `http://gedcomx.org/${gender}`,
    };
  }

  name({person, name, given, surname, prefix, suffix}) {
    const p = this.person({id: person});

    if (p.names === undefined) {
      p.names = [];
    }

    // Check to see if any parts are specified. If not then
    // process the name to get the parts.
    if (name && !(given || surname)) {
      const nameParts = name.split(/\s+/g);
      if (nameParts.length === 1) {
        given = nameParts[0];
      } else {
        surname = nameParts.pop();
        given = nameParts.join(' ');
      }
    }
    
    // This is populated as we process the parts so that later
    // we can join them together to generate the full text value
    const pieces = [];

    const nameForm = {
      parts: [],
    };

    if(prefix) {
      prefix = prefix.trim();
      nameForm.parts.push({
        type: 'http://gedcomx.org/Prefix',
        value: prefix,
      });
      pieces.push(prefix);
    }
    if(given) {
      given = given.trim();
      nameForm.parts.push({
        type: 'http://gedcomx.org/Given',
        value: given,
      });
      pieces.push(given);
    }
    if(surname) {
      surname = surname.trim();
      nameForm.parts.push({
        type: 'http://gedcomx.org/Surname',
        value: surname,
      });
      pieces.push(surname);
    }
    if(suffix) {
      suffix = suffix.trim();
      nameForm.parts.push({
        type: 'http://gedcomx.org/Suffix',
        value: suffix,
      });
      pieces.push(suffix);
    }

    // Check to see if the name is specified. If not then
    // create it by joining the parts.
    if (!name && pieces.length) {
      name = pieces.join(' ');
    }

    nameForm.fullText = name;

    // Check for a duplicate name
    // TODO: consider making this more robust by comparing name parts
    let duplicate = false;
    for(let n of p.names) {
      for(let nf of n.nameForms) {
        if(nf.fullText === name) {
          duplicate = true;
        }
      }
    }
    if(duplicate) {
      return;
    }

    p.names.push({
      nameForms: [nameForm],
    });
  }

  fact(type, {person, place, date, value}) {
    const p = this.person({id: person});

    if (p.facts === undefined) {
      p.facts = [];
    }

    const fact = {
      type: `http://gedcomx.org/${type}`,
    };

    if (place) {
      fact.place = {
        original: place,
      };
    }

    if (date) {
      fact.date = {
        original: date,
      };
    }

    if (value) {
      fact.value = value;
    }

    // Dedupe birth events
    if (type === 'Birth') {
      for (const existingFact of p.facts) {
        if (existingFact.type === `http://gedcomx.org/${type}`) {
          if (existingFact.date === undefined && fact.date !== undefined) {
            existingFact.date = fact.date;
          }
          if (existingFact.place === undefined && fact.place !== undefined) {
            existingFact.place = fact.place;
          }
          // We updated the fact, so return instead of adding
          return;
        }
      }
    }

    p.facts.push(fact);
  }

  parent(type, {person, place, date, parents = []}) {
    const p = this.person({id: person});
    let parent1 = null;
    let parent2 = null;

    if (parents.length >= 1) {
      parent1 = this.person({id: parents[0]});
    }
    if (parents.length >= 2) {
      parent2 = this.person({id: parents[1]});
    }

    // Create the fact
    this.fact(type, {person, place, date});

    if (this._model.relationships === undefined) {
      this._model.relationships = [];
    }

    if (parent1 !== null) {
      // TODO ensure relationship does not already exist
      this._model.relationships.push({
        type: 'http://gedcomx.org/ParentChild',
        person1: {
          resource: `#${parent1.id}`,
        },
        person2: {
          resource: `#${p.id}`,
        },
      });
    }
    if (parent2 !== null) {
      // TODO ensure relationship does not already exist
      this._model.relationships.push({
        type: 'http://gedcomx.org/ParentChild',
        person1: {
          resource: `#${parent2.id}`,
        },
        person2: {
          resource: `#${p.id}`,
        },
      });
    }
  }

  spouse(type, {spouses, place, date}) {
    let spouse1 = this.person({id: spouses[0]});
    let spouse2 = null;

    if (spouses.length >= 2) {
      spouse2 = this.person({id: spouses[1]});
    }

    // Create the fact
    const fact = {
      type: `http://gedcomx.org/${type}`,
    };

    if (place) {
      fact.place = {
        original: place,
      };
    }

    if (date) {
      fact.date = {
        original: date,
      };
    }

    if (this._model.relationships === undefined) {
      this._model.relationships = [];
    }

    if (spouse2 !== null) {
      // TODO ensure relationship does not already exist
      this._model.relationships.push({
        type: 'http://gedcomx.org/Couple',
        person1: {
          resource: `#${spouse1.id}`,
        },
        person2: {
          resource: `#${spouse2.id}`,
        },
        facts: [fact],
      });
    }
  }

  citation({title, url, accessed, repository_name, repository_website, repository_url}) {
    if (this._model.agents === undefined) {
      this._model.agents = [];
    }

    if (this._model.agents.length === 0) {
      this._model.agents.push({
        id: 'agent',
        names: [{
          lang: 'en',
          value: repository_name,
        }],
        homepage: {
          resource: repository_url,
        },
      });
    }

    if (this._model.sourceDescriptions === undefined) {
      this._model.sourceDescriptions = [];
    }

    const description = {
      id: this._model.sourceDescriptions + 1,
      citations: [{
        value: `${title}, ${repository_name} (${url} : accessed ${new Date(accessed).toDateString()})`,
      }],
      about: url,
      titles: [{
        value: title,
      }],
      repository: {
        resource: '#agent',
      },
    };

    this._model.sourceDescriptions.push(description);
  }
}

export default GedcomX;
