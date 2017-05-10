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

    let idx = this._findPerson(id);
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
    let idx = this._findPerson(person);
    if (idx === null) {
      idx = this.person({id: person});
    }

    this._model.persons[idx].gender = {
      type: `http://gedcomx.org/${gender}`,
    };
  }

  _findPerson(id) {
    if (!Array.isArray(this._model.persons)) {
      return null;
    }
    for (let i = 0; i < this._model.persons.length; i++) {
      if (this._model.persons[i].id === id) {
        return i;
      }
    }
    return null;
  }
}

export default GedcomX;
