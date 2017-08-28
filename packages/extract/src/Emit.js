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
  'Ethnicity',
  'MaritalStatus',
  'Mission',
  'Nationality',
  'NationalId',
  'Occupation',
  'Ordination',
  'Race',
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
  
  /**
   * @param {Extraction} extraction 
   */
  constructor(extraction) {
    this.extraction = extraction;
  }

  /**
   * Used to show that two people are the same person in the extraction.
   * 
   * @param {Object} data
   * @param {String} data.person person ID
   * @param {String} data.id alternate person ID
   * @param {Boolean=} data.preferred whether the combinator should use the alternate ID in the output
   */ 
  AlternateId({person, id, preferred = false}) {
    if (!person) {
      this.extraction.error(new Error('alternateId missing person'));
      return;
    }
    if (!id) {
      this.extraction.error(new Error('alternateId missing id'));
      return;
    }
    this.extraction.data({
      type: 'AlternateId',
      data: {
        person,
        id,
        preferred,
      },
    });
  }

  /**
   * Add a citation for the record being extracted.
   * 
   * @param {Object} data
   * @param {String} data.title Title of the record
   * @param {String} data.url URL of the record
   * @param {Integer} data.accessed Timestamp representing when the record was accessed
   * @param {String=} data.repository_name Human-readable name for the repository where the record exists
   * @param {String=} data.repository_website Domain of the repository website
   * @param {String=} data.repository_url Full URL of the repository website
   */
  Citation({title, url, accessed, repository_name, repository_website, repository_url}) {
    if (!title) {
      this.extraction.error(new Error('citation missing title'));
      return;
    }
    if (!url) {
      this.extraction.error(new Error('citation missing url'));
      return;
    }
    if (!accessed) {
      this.extraction.error(new Error('citation missing accessed'));
      return;
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

  /**
   * A person id on the website. The url should be for a user to click on.
   * Not sure what this is for: https://github.com/genxtract/genxtract/issues/46
   * 
   * @param {Object} data
   * @param {String} data.person Person ID
   * @param {String} data.url URL for the person
   * @param {String} data.id ID of the person
   */
  ExternalId({person, url, id}) {
    if (!person) {
      this.extraction.error(new Error('externalId missing person'));
      return;
    }
    if (!url) {
      this.extraction.error(new Error('externalId missing url'));
      return;
    }
    if (!id) {
      this.extraction.error(new Error('externalId missing id'));
      return;
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

  /**
   * Emit the gender of a person.
   * 
   * @param {Object} data
   * @param {String} data.person Person ID
   * @param {String} data.gender Gender. Valid values are `Male` or `Female`
   */
  Gender({person, gender}) {
    if (!person) {
      this.extraction.error(new Error('gender missing person'));
      return;
    }
    if (!gender) {
      this.extraction.error(new Error('gender missing gender'));
      return;
    }
    if (!['Male', 'Female'].includes(gender)) {
      this.extraction.error(new Error('gender invalid gender'));
      return;
    }
    this.extraction.data({
      type: 'Gender',
      data: {
        person,
        gender,
      },
    });
  }

  /**
   * Add a name to a person. While all of the name options are
   * marked as optional, at least one of them must be specified.
   * If the parts are specified without the full name then the
   * full name will be constructed from the parts.
   * 
   * @param {Object} data
   * @param {String} data.person Person ID
   * @param {String=} data.name Person's full name
   * @param {String=} data.given Person's given names
   * @param {String=} data.surname Person's surnames
   * @param {String=} data.prefix Person's name prefix
   * @param {String=} data.suffix Person's name suffix
   */
  Name({person, name, given, surname, prefix, suffix}) {
    if (!person) {
      this.extraction.error(new Error('name missing person'));
      retur;
    }
    if (!name && !given && !surname && !prefix && !suffix) {
      this.extraction.error(new Error('name must have a name or at least one part'));
      return;
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

  /**
   * Add a person.
   * 
   * @param {Object} data
   * @param {String} data.id Person's ID
   * @param {Boolean=} data.primary Whether the person is considered the primary or principle person
   */
  Person({id, primary}) {
    if (!id) {
      this.extraction.error(new Error('person missing id'));
      return;
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

/**
 * Extend the class with basic events. These have the following signature:
 * 
 * @param {Object} data
 * @param {String} data.person Person ID
 * @param {String=} data.place Place name
 * @param {String=} data.date Date
 */
for (let key of basicEvents) {
  Emit.prototype[key] = function({person, place, date}) {
    if (!person) {
      this.extraction.error(new Error(`${key} missing person`));
      return;
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

/**
 * Extend the class with basic facts. These have the following signature:
 * 
 * @param {Object} data
 * @param {String} data.person Person ID
 * @param {String=} data.place Place name
 * @param {String=} data.date Date
 * @param {String} data.value Fact value
 */
for (let key of basicFacts) {
  Emit.prototype[key] = function({person, place, date, value}) {
    if (!person) {
      this.extraction.error(new Error(`${key} missing person`));
      return;
    }
    if (!value) {
      this.extraction.error(new Error(`${key} missing value`));
      return;
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

/**
 * Extend the class with parent events. These have the following signature:
 * 
 * Must have at least a place, date, or parents.
 * 
 * @param {Object} data
 * @param {String} data.person Person ID
 * @param {String=} data.place Place name
 * @param {String=} data.date Date
 * @param {String[]=} data.parents List of parent IDs
 */
for (let key of parentEvents) {
  Emit.prototype[key] = function({person, place, date, parents}) {
    if (!person) {
      this.extraction.error(new Error(`${key} missing person`));
      return;
    }
    if (!place && !date && !Array.isArray(parents)) {
      this.extraction.error(new Error(`${key} must have a place, date, or parents`));
      return;
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

/**
 * Extend the class with spouse events. These have the following signature:
 * 
 * @param {Object} data
 * @param {String[]} data.spouses List of parent IDs
 * @param {String=} data.place Place name
 * @param {String=} data.date Date
 */
for (let key of spouseEvents) {
  Emit.prototype[key] = function({spouses, place, date}) {
    if (!spouses || !Array.isArray(spouses) || spouses.length === 0) {
      this.extraction.error(new Error(`${key} missing spouses`));
      return;
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
