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

    this._model.persons[idx].facts.push(fact);
  }

}

export default GedcomX;
