import Combinator from '@genxtract/combinator';

/**
 * Combinator that outputs data in the GEDCOM X JavaScript format.
 * Data is returned as a POJO.
 */
class GedcomX extends Combinator {
  
  /**
   * @param {Object=} args See the Combinator docs for available options.
   */
  constructor(args = {}) {
    super(args);

    // Represents the constructed GEDCOM X data
    this._model = {};

    // And index to the persons, keyed by person ID
    this._personsIndex = {};
  }

  /**
   * Process data from the extractor. This method is called by
   * methods defined in Combinator.
   * 
   * @abstract
   * @param {Object} obj
   * @param {String} obj.type Data type
   * @param {Object} obj.data Data
   * @return {void}
   */
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

  /**
   * Post-processing of data before it's serialized.
   * 
   * We reference a sourceDescription from persons and
   * relationships, if a sourceDescription is available.
   */
  finalizeCallback() {
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

  /**
   * Serialize the model. This returns a POJO.
   * 
   * @return {Object}
   */
  serializeCallback() {
    return this._model;
  }

  /**
   * Add a person
   * 
   * @param {Object} data
   * @param {String} data.id Person's ID
   * @param {Boolean=} data.primary Whether the person is the primary/principle person of the record
   * @return {Person} The GEDCOM X person object
   */
  person({id, primary}) {
    
    // Create the list of persons if it doesn't already exist
    if (this._model.persons === undefined) {
      this._model.persons = [];
    }

    // Cast as a string
    id = '' + id;

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

  /**
   * Allow for a person to be referenced by an alternate ID
   * 
   * @param {Object} data
   * @param {String} data.person Previous person ID
   * @param {String} data.id Alternate person ID
   * @param {Boolean=} data.preferred If preferred, this ID will be included in the serialized data
   */
  alternateId({person, id, preferred}) {
    const p = this.person({id: person});
    this._personsIndex[id] = p;
    if(preferred) {
      p.id = id;
      // Update references in relationships
      if(this._model.relationships) {
        this._model.relationships.forEach((rel) => {
          if(rel.person1.resource.substr(1) === person) {
            rel.person1.resource = `#${id}`;
          }
          if(rel.person2.resource.substr(1) === person) {
            rel.person2.resource = `#${id}`;
          }
        });
      }
    }
  }

  /**
   * Add a person's gender
   * 
   * @param {Object} data
   * @param {String} data.person Person ID
   * @param {String} data.gender `Male` or `Female`
   */
  gender({person, gender}) {
    const p = this.person({id: person});
    p.gender = {
      type: `http://gedcomx.org/${gender}`,
    };
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

  /**
   * Add a fact to a person.
   * 
   * @param {String} type 
   * @param {Object} data
   * @param {String} data.person Person ID
   * @param {String=} data.place Place name
   * @param {String=} data.date Date
   * @param {String=} data.value Fact value
   */
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

  /**
   * Add parents of a person and or a parent event
   * 
   * @param {String} type Event type
   * @param {Object} data
   * @param {String} data.person
   * @param {String=} data.place
   * @param {String=} data.date
   * @param {String[]=} data.parents List of parent IDs.
   */
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
    if(place || date) {
      this.fact(type, {person, place, date});
    }

    if (parent1 !== null) {
      this._addRelationship('ParentChild', parent1.id, p.id);
    }
    if (parent2 !== null) {
      this._addRelationship('ParentChild', parent2.id, p.id);
    }
  }

  /**
   * Add a spouse event and or a spouse relationship
   * 
   * @param {String} type Event type
   * @param {Object} data
   * @param {String[]} data.spouses List of spouse (person) IDs.
   * @param {String=} data.place
   * @param {String=} data.date
   */
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

    if (spouse2 !== null) {
      this._addRelationship('Couple', spouse1.id, spouse2.id, [fact]);
    }

    // When we only have one spouse just add the fact to the person
    else {
      if(!Array.isArray(spouse1.facts)) {
        spouse1.facts = [];
      }
      spouse1.facts.push(fact);
    }
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
      id: '' + (this._model.sourceDescriptions.length + 1),
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

  /**
   * Add a relationship to the model. This method checks for and avoid
   * creating duplicate relationships. If facts are specified and an
   * existing relationship is found then that existing relationship 
   * will have the new facts merged into it and deduplicated.
   * 
   * @param {String} type Relationship type
   * @param {String} id1 ID of person1
   * @param {String} id2 ID of person2
   * @param {Object[]} facts List of facts that should be added to the relationship.
   */
  _addRelationship(type, id1, id2, facts) {
    if (!Array.isArray(this._model.relationships)) {
      this._model.relationships = [];
    }

    const relationship = {
      type: `http://gedcomx.org/${type}`,
      person1: {
        resource: `#${id1}`,
      },
      person2: {
        resource: `#${id2}`,
      },
    };
    if(Array.isArray(facts)) {
      relationship.facts = facts;
    }

    // Check for an existing relationship
    const existingRelationship = this._model.relationships.find((rel) => {
      return relationshipsEqual(relationship, rel);
    });
    
    // Merge facts into an existing relationship
    if(existingRelationship && relationship.facts) {
      if(!Array.isArray(existingRelationship.facts)) {
        existingRelationship.facts = [];
      }
      mergeFacts(existingRelationship.facts, relationship.facts);
    }

    // Add the relationship if it doesn't already exist
    if(!existingRelationship) {
      this._model.relationships.push(relationship);
    }
    
  }

}

/**
 * Merge a list of facts into another list of facts.
 * Compares facts to avoid adding duplicates.
 * 
 * @param {Object[]} originalFacts
 * @param {Object[]} newFacts
 */
function mergeFacts(originalFacts, newFacts) {
  if(originalFacts === undefined || newFacts === undefined) {
    return;
  }
  newFacts.forEach((fact) => {
    addFact(originalFacts, fact);
  });
}

/**
 * Add a fact to a list of facts, comparing to the
 * existing facts to avoid adding duplicates.
 * 
 * @param {Object[]} facts
 * @param {Object} newFact
 */
function addFact(facts, newFact) {
  const existingFact = facts.find((f) => {
    return factsEqual(newFact, f);
  });
  if(!existingFact) {
    facts.push(newFact);
  }
}

/**
 * Compare to GEDCOM X relationships. Returns true if the type,
 * person1, and person2 are equal. Facts are not compared.
 * 
 * @param {Object} rel1
 * @param {Object} rel2
 * @return {Boolean}
 */
function relationshipsEqual(rel1, rel2) {
  if(rel1 === rel2) {
    return true;
  }
  return rel1 && rel2 && rel1.type === rel2.type &&
    rel1.person1.resource === rel2.person1.resource &&
    rel1.person2.resource === rel2.person2.resource;
}

/**
 * Determine whether two facts are equal
 * 
 * @param {Object} fact1
 * @param {Object} fact2
 * @return {Boolean}
 */
function factsEqual(fact1, fact2) {
  if(fact1 === fact2) {
    return true;
  }
  return fact1 && fact2 &&
    fact1.type === fact2.type &&
    datesEqual(fact1.date, fact2.date) &&
    placesEqual(fact1.place, fact2.place);
}

/**
 * Determine whether two dates are equal
 * 
 * @param {Object} date1
 * @param {Object} date2
 * @return {Boolean}
 */
function datesEqual(date1, date2) {
  if(date1 === date2) {
    return true;
  }
  return date1 && date2 && date1.original === date2.original;
}

/**
 * Determine whether two places are equal
 * 
 * @param {Object} place1
 * @param {Object} place2
 * @return {Boolean}
 */
function placesEqual(place1, place2) {
  if(place1 === place2) {
    return true;
  }
  return place1 && place2 && place1.original === place2.original;
}

export default GedcomX;
