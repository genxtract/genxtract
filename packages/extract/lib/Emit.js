// These expect person, place, date
// See class functions below for other events
const basicEvents = [
  'Baptism',
  'BarMitzvah',
  'Blessing',
  'Burial',
  'Christening',
  'Confirmation',
  'Cremation',
  'Death',
  'Excommunication',
  'FirstCommunion',
  'Funeral',
  'Stillbirth',
];

// These expect person, place, date, value
const basicFacts = [
  'Caste',
  'Citizenship',
  'Education',
  'Mission',
  'Nationality',
  'Occupation',
  'Ordination',
];

// These expect person, place, date, parents
const parentEvents = [
  'Adoption',
  'Birth',
];

// These expect spouses, date, place
const marriageEvents = [
  'Annulment',
  'Divorce',
  'Marriage',
  'Separation',
];

// Keep functions in alphabetical order
class Emit {
  constructor(extraction) {
    this.extraction = extraction;
  }

  // Used to show that two people are the same person in the extraction
  AlternateId({person, id}) {
    if (!person) {
      return this.extraction.error(new Error('alternateId missing person'));
    }
    if (!id) {
      return this.extraction.error(new Error('alternateId missing id'));
    }
    this.extraction.data({
      type: 'AlternateId',
      data: {
        person,
        id,
      }
    });
  }

  // A person id on the website. The url should be for a user to click on
  ExternalId({person, url, id}) {
    if (!person) {
      return this.extraction.error(new Error('externalId missing person'));
    }
    if (!url) {
      return this.extraction.error(new Error('externalId missing url'));
    }
    if (!id) {
      return this.extraction.error(new Error('externalId missing id'));
    }
    this.extraction.data({
      type: 'ExternalId',
      data: {
        person,
        url,
        id,
      }
    });
  }

  Gender({person, gender}) {
    if (!person) {
      return this.extraction.error(new Error('gender missing person'));
    }
    if (!gender) {
      return this.extraction.error(new Error('gender missing gender'));
    }
    this.extraction.data({
      type: 'Gender',
      data: {
        person,
        gender,
      }
    });
  }

  Name({person, name}) {
    if (!person) {
      return this.extraction.error(new Error('name missing person'));
    }
    if (!name) {
      return this.extraction.error(new Error('name missing name'));
    }
    this.extraction.data({
      type: 'Name',
      data: {
        person,
        name,
      }
    });
  }

  Person({id, primary}) {
    if (!id) {
      return this.extraction.error(new Error('person missing id'));
    }
    this.extraction.data({
      type: 'Person',
      data: {
        id,
        primary,
      }
    });
  }
}

// Extend the class with basic events
for (let key of basicEvents) {
  Emit.prototype[key] = function({person, place, date}) {
    if (!person) {
      return this.extraction.error(new Error(`${key} missing person`));
    }
    this.extraction.data({
      type: key,
      data: {
        person,
        place,
        date,
      }
    });
  }
}

// Extend the class with basic facts
for (let key of basicFacts) {
  Emit.prototype[key] = function({person, place, date, value}) {
    if (!person) {
      return this.extraction.error(new Error(`${key} missing person`));
    }
    if (!value) {
      return this.extraction.error(new Error(`${key} missing value`));
    }
    this.extraction.data({
      type: key,
      data: {
        person,
        place,
        date,
        value,
      }
    });
  }
}

// Extend the class with parent events
for (let key of parentEvents) {
  Emit.prototype[key] = function({person, place, date, parents}) {
    if (!person) {
      return this.extraction.error(new Error(`${key} missing person`));
    }
    if (!parents || !Array.isArray(parents)) {
      return this.extraction.error(new Error(`${key} missing parents`));
    }
    this.extraction.data({
      type: key,
      data: {
        person,
        place,
        date,
        parents,
      }
    });
  }
}

// Extend the class with marriage events
for (let key of marriageEvents) {
  Emit.prototype[key] = function({spouses, place, date}) {
    if (!spouses || !Array.isArray(spouses) || spouses.length === 0) {
      return this.extraction.error(new Error(`${key} missing spouses`));
    }
    this.extraction.data({
      type: key,
      data: {
        spouses,
        place,
        date,
      }
    });
  }
}

export default Emit;
