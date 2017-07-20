import Combinator from '@genxtract/combinator';

class GedcomX extends Combinator {
  constructor(args = {}) {
    super(args);
    // Setup model
    this._model = {};
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
      case 'Emmigration':
      case 'Immigration':
      case 'Mission':
      case 'Nationality':
      case 'Naturalization':
      case 'Occupation':
      case 'Ordination':
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
    if (this._model.persons === undefined) {
      this._model.persons = [];
    }

    let idx = null;
    for (let i = 0; i < this._model.persons.length; i++) {
      if (this._model.persons[i].id === id) {
        idx = i;
        break;
      }
    }
    if (idx === null) {
      const person = {id};
      if (primary) {
        person.principle = true;
      }
      this._model.persons.push(person);
      idx = this._model.persons.length - 1;
    }
    return idx;
  }

  gender({person, gender}) {
    const idx = this.person({id: person});

    this._model.persons[idx].gender = {
      type: `http://gedcomx.org/${gender}`,
    };
  }

  name({person, name}) {
    const idx = this.person({id: person});

    if (this._model.persons[idx].names === undefined) {
      this._model.persons[idx].names = [];
    }

    // Check for a duplicate name
    let duplicate = false;
    for(let n of this._model.persons[idx].names) {
      for(let nf of n.nameForms) {
        if(nf.fullText === name) {
          duplicate = true;
        }
      }
    }
    if(duplicate) {
      return;
    }

    const nameParts = name.split(/\s+/g);

    const nameForm = {
      fullText: nameParts.join(' '),
      parts: [],
    };

    if (nameParts.length === 1) {
      nameForm.parts.push({
        type: 'http://gedcomx.org/Given',
        value: nameParts[0],
      });
    } else {
      let surname = nameParts.pop();
      nameForm.parts.push({
        type: 'http://gedcomx.org/Given',
        value: nameParts.join(' '),
      });
      nameForm.parts.push({
        type: 'http://gedcomx.org/Surname',
        value: surname,
      });
    }

    this._model.persons[idx].names.push({
      nameForms: [nameForm],
    });
  }

  fact(type, {person, place, date, value}) {
    const idx = this.person({id: person});

    if (this._model.persons[idx].facts === undefined) {
      this._model.persons[idx].facts = [];
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
      for (const existingFact of this._model.persons[idx].facts) {
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

    this._model.persons[idx].facts.push(fact);
  }

  parent(type, {person, place, date, parents}) {
    const idx = this.person({id: person});
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
          resource: `#${this._model.persons[parent1].id}`,
        },
        person2: {
          resource: `#${this._model.persons[idx].id}`,
        },
      });
    }
    if (parent2 !== null) {
      // TODO ensure relationship does not already exist
      this._model.relationships.push({
        type: 'http://gedcomx.org/ParentChild',
        person1: {
          resource: `#${this._model.persons[parent2].id}`,
        },
        person2: {
          resource: `#${this._model.persons[idx].id}`,
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
          resource: `#${this._model.persons[spouse1].id}`,
        },
        person2: {
          resource: `#${this._model.persons[spouse2].id}`,
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
