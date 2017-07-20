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
  'Emmigration',
  'Immigration',
  'Naturalization',
  'Residence',
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
const spouseEvents = [
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
      },
    });
  }

  // Information about the record itself
  Citation({title, url, accessed, repository_name, repository_website, repository_url}) {
    if (!title) {
      return this.extraction.error(new Error('citation missing title'));
    }
    if (!url) {
      return this.extraction.error(new Error('citation missing url'));
    }
    if (!accessed) {
      return this.extraction.error(new Error('citation missing accessed'));
    }
    this.extraction.data({
      type: 'Citation',
      data: {
        title,
        url,
        accessed,
        repository_name,
        repository_website,
        repository_url,
      },
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
      },
    });
  }

  Gender({person, gender}) {
    if (!person) {
      return this.extraction.error(new Error('gender missing person'));
    }
    if (!gender) {
      return this.extraction.error(new Error('gender missing gender'));
    }
    if (!['Male', 'Female'].includes(gender)) {
      return this.extraction.error(new Error('gender invalid gender'));
    }
    this.extraction.data({
      type: 'Gender',
      data: {
        person,
        gender,
      },
    });
  }

  Name({person, name, given, surname, prefix, suffix}) {
    if (!person) {
      return this.extraction.error(new Error('name missing person'));
    }
    if (!name && !given && !surname && !prefix && !suffix) {
      return this.extraction.error(new Error('name must have a name or at least one part'));
    }
    this.extraction.data({
      type: 'Name',
      data: {
        person,
        name,
        given,
        surname,
        prefix,
        suffix,
      },
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
      },
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
      },
    });
  };
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
      },
    });
  };
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
      },
    });
  };
}

// Extend the class with spouse events
for (let key of spouseEvents) {
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
      },
    });
  };
}

export default Emit;
