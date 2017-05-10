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
        return this.fact(type, data);
      case 'Adoption':
      case 'Birth':
        return this.parent(type, data);
      case 'Annulment':
      case 'Divorce':
      case 'Marriage':
      case 'Separation':
        return this.spouse(type, data);
      default:
        // TODO silently ignore?
        console.log(`Unknown: ${type}`, data);
    }
  }

  // (Optional) Finalize
  finalizeCallback() {
    // TODO final work
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

    // TODO dedupe facts?

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
    this.fact(type, {person: spouses[0], place, date});

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
      });
    }
  }
}

export default GedcomX;
