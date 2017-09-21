import Extraction from '../Extraction.js';
import HorizontalTable from '../lib/HorizontalTable.js';
import VerticalTable from '../lib/VerticalTable.js';
import {toTitleCase} from '../lib/utils.js';

const extraction = new Extraction('findmypast-record');
extraction.start();

const personId = getRecordId(document.location.href);

extraction.Person({
  id: personId,
  primary: true,
});
extraction.ExternalId({
  person: personId,
  url: window.location.href,
  id: personId,
});

const transcriptionDisplayTable = document.getElementById('transcriptionDisplayTable');
if(transcriptionDisplayTable) {

  const dataFields = new HorizontalTable(transcriptionDisplayTable, {
    labelMapper: function(label) {
      return label.toLowerCase();
    },
  });

  extraction.Name({
    person: personId,
    given: processName(dataFields.getText('first name(s)')),
    surname: processName(dataFields.getText('last name')),
  });

  if(dataFields.hasLabel('sex') || dataFields.hasLabel('gender')) {
    extraction.Gender({
      person: personId,
      gender: dataFields.getFirstText(['sex', 'gender']),
    });
  }
  
  // Misc facts
  [
    {
      type: 'MaritalStatus',
      label: 'marital status',
    },
    {
      type: 'Occupation',
      label: 'occupation',
    },
    {
      type: 'Residence',
      label: 'residence',
    },
    {
      type: 'Nationality',
      label: 'nationality',
    },
  ].forEach(function(config) {
    const text = dataFields.getText(config.label);
    if(text && text !== '-') {
      extraction[config.type]({
        person: personId,
        value: dataFields.getText(config.label),
      });
    }
  });
  
  // Events
  emitBirth(personId, dataFields);
  emitBaptism(personId, dataFields);
  emitDeath(personId, dataFields);
  emitBurial(personId, dataFields);
  emitEmigration(personId, dataFields);
  emitImmigration(personId, dataFields);

  //
  // Relationships
  //
  
  const spouses = [personId];

  // Household
  const individualsTable = document.getElementById('individuals');
  const primaryRelationship = dataFields.getText('relationship');
  const siblings = [];
  let headId;
  let headsWifeId;
  if(individualsTable) {
    const householdData = new VerticalTable(individualsTable, {
      rowSelector: 'tr:not(.highlight-individual)', // Skip primary person
      labelMapper: function(label) {
        return label.toLowerCase().trim();
      },
      valueMapper: function(cell) {
        
        // We want to get the href of the Transcription buttons without huge
        // modifications to anything else so we're doing a bit of a hack.
        // We're going to return the href when we detect an <a> in the cell.
        // Otherwise we'll return the text.
        // This is fragile in that we're assuming the button column remains
        // the only column with no label. If that ever changes (there are multiple
        // columns with no label) then one of them will overwrite the other.
        const link = cell.querySelector('a');
        const text = cell.textContent;
        if(link) {
          return link.href;
        } else {
          return text && text !== '-' ? text : undefined;
        }
      },
    });
    householdData.getRows().forEach(function(row) {
      const householdPersonId = processHouseholdPerson(row);
      if(row['relationship'] === 'Self') {
        row['relationship'] = 'Head';
      }
      switch(primaryRelationship + ':' + row['relationship']) {
        case 'Head:Wife':
        case 'Wife:Head':
          extraction.Marriage({
            spouses: [personId, householdPersonId],
          });
          break;
        case 'Head:Daughter':
        case 'Head:Son':
          extraction.Birth({
            person: householdPersonId,
            parents: [personId],
          });
          break;
        case 'Daughter:Head':
        case 'Son:Head':
          headId = householdPersonId;
          extraction.Birth({
            person: personId,
            parents: [householdPersonId],
          });
          break;
        case 'Son:Son':
        case 'Son:Daughter':
        case 'Daughter:Son':
        case 'Daughter:Daughter':
          siblings.push(householdPersonId);
          break;
        case 'Son:Wife':
        case 'Daughter:Wife':
          headsWifeId = householdPersonId;
          break;
      }
    });
    if(headId) {
      siblings.forEach(function(siblingId) {
        extraction.Birth({
          person: siblingId,
          parents: [headId],
        });
      });
    }
    if(headId && headsWifeId) {
      extraction.Marriage({
        spouses: [headId, headsWifeId],
      });
    }
  }
  
  // If a census household table isn't listed then look for relationship info
  // in the record details. We don't do both because relationships may be
  // listed in both which leads to duplicate info.
  else {
  
    const parents = [];

    // Father
    const fatherId = `${personId}-f`;
    const fatherName = getName(dataFields, 'father\'s first name(s)', 'father\'s last name') ||
                       getName(dataFields, 'groom\'s father\'s first name(s)', 'groom\'s father\'s last name');
    if(fatherName) {
      fatherName.person = fatherId;
      extraction.Name(fatherName);
      parents.push(fatherId);
    }
    
    // Mother
    const motherId = `${personId}-m`;
    const motherName = getName(dataFields, 'mother\'s first name(s)', 'mother\'s last name');
    if(motherName) {
      motherName.person = motherId;
      extraction.Name(motherName);
      parents.push(motherId);
    }

    if(parents.length > 0) {
      extraction.Birth({
        person: personId,
        parents,
      });
    }
    if(parents.length === 2) {
      extraction.Marriage({
        spouses: parents,
      });
    }
    
    // Spouse
    const spouseId = `${personId}-s`;
    const spouseName = getName(dataFields, 'spouse\'s first name(s)', 'spouse\'s last name');
    if(spouseName) {
      spouseName.person = spouseId;
      extraction.Name(spouseName);
      spouses.push(spouseId);
      
      if(dataFields.hasLabel('spouse\'s sex')) {
        extraction.Gender({
          person: spouseId,
          gender: dataFields.getText('spouse\'s sex'),
        });
      }

      // Spouse's parents
      const spousesParents = [];
      const spousesFatherId = `${spouseId}-f`;
      const spousesFatherName = getName(dataFields, 'spouse\'s father\'s first name(s)', 'spouse\'s father\'s last name') ||
                                getName(dataFields, 'bride\'s father\'s first name(s)', 'bride\'s father\'s last name');
      if(spousesFatherName) {
        spousesFatherName.person = spousesFatherId;
        extraction.Name(spousesFatherName);
        spousesParents.push(spousesFatherId);
      }
      const spousesMotherId = `${spouseId}-m`;
      const spousesMotherName = getName(dataFields, 'spouse\'s mother\'s first name(s)', 'spouse\'s mother\'s last name');
      if(spousesMotherName) {
        spousesMotherName.person = spousesMotherId;
        extraction.Name(spousesMotherName);
        spousesParents.push(spousesMotherId);
      }
      if(spousesParents.length > 0) {
        extraction.Birth({
          person: spouseId,
          parents: spousesParents,
        });
      }
      if(spousesParents.length === 2) {
        extraction.Marriage({
          spouses: spousesParents,
        });
      }
    }
  
  }

  // We process this outside of relationships because marriage date or place may be
  // listed in a record without listing the spouse.
  const marriage = {
    spouses,
  };
  const marriageDate = getMarriageDate(dataFields);
  if(marriageDate) {
    marriage.date = marriageDate;
  }
  const marriagePlace = getMarriagePlace(dataFields);
  if(marriagePlace) {
    marriage.place = marriagePlace;
  }
  if(marriage.spouses.length === 2 || marriage.date || marriage.place) {
    extraction.Marriage(marriage);
  }

}

extraction.Citation({
  title: document.title,
  url: window.location.href,
  accessed: Date.now(),
  repository_name: 'findmypast',
  repository_website: window.location.hostname,
  repository_url: window.location.origin,
});

extraction.end();

/**
 * Get a records ID
 * 
 * @param {String} url
 * @return {String}
 */
function getRecordId(url) {
  return decodeURIComponent(new URL(url).searchParams.get('id')).replace(/\//g, '-');
}

/**
 * Extract a person's name, if available
 * 
 * @param {VerticalTable} data 
 * @param {String} givenNameLabel 
 * @param {String} surnameLabel
 * @return {Object} name
 */
function getName(data, givenNameLabel, surnameLabel) {
  const given = processName(data.getText(givenNameLabel));
  const surname = processName(data.getText(surnameLabel));
  if(given || surname) {
    return {given, surname};
  }
}

/**
 * Capitalize a name properly. Ignore empty "-" values.
 * 
 * @param {String} name
 * @return {String}
 */
function processName(name) {
  if(!name || name === '-') {
    return;
  } else {
    return toTitleCase(name);
  }
}

/**
 * Concatenate year,month,day if all are defined.
 * Return year if only defined.
 * Return undefined if no data.
 * 
 * @param {String} year
 * @param {String} month
 * @param {String} day
 * @return {String}
 */
function processDate(year, month, day) {
  if(year === '-') {
    year = undefined;
  }
  if(month === '-') {
    month = undefined;
  }
  if(day === '-') {
    day = undefined;
  }
  if(year) {
    if(month && day) {
      return day + ' ' + month + ' ' + year;
    } else {
      return year;
    }
  }
}

/**
 * Extract the place for the record.
 * This method doesn't pay attention to whether the
 * place is for birth, marriage, death, residence, or other.
 * The method calling this needs to take care of interpreting
 * what event the place is associated with.
 * 
 * @param {Object} data
 * @return {String}
 */
function getPlace(data) {
  const town = data.getFirstText(['place', 'district', 'town', 'residence town', 'parish']);
  const county = data.getText('county');
  const state = data.getFirstText(['state', 'residence state']);
  const country = data.getText('country');
      
  // Remove falsy values, capitalize properly, and turn into a readable string
  return [town, state, county, country].filter(function(a) {
    return !!a && a !== '-';
  }).map(function(a) { 
    return toTitleCase(a); 
  }).join(', ');
}

function emitBirth(personId, data) {
  return emitFact(personId, data, 'Birth', getBirthDate, getBirthPlace);
}

function emitBaptism(personId, data) {
  emitFact(personId, data, 'Baptism', getBaptismDate, getBaptismPlace, function(baptism) {
    return !!baptism.date;
  });
}

function emitDeath(personId, data) {
  return emitFact(personId, data, 'Death', getDeathDate, getDeathPlace);
}

function emitBurial(personId, data) {
  return emitFact(personId, data, 'Burial', getBurialDate, function(data) {
    // TODO: no example of a burial place
  });
}

function emitEmigration(personId, data) {
  return emitFact(personId, data, 'Emigration', getEmigrationDate, getEmigrationPlace);
}

function emitImmigration(personId, data) {
  return emitFact(personId, data, 'Immigration', getImmigrationDate, getImmigrationPlace);
}

function emitFact(personId, data, type, dateFunc, placeFunc, validate) {
  const date = dateFunc(data);
  const place = placeFunc(data);
  const fact = {
    person: personId,
  };
  if(date === '-') {
    date = undefined;
  }
  if(place === '-') {
    place = undefined;
  }
  if(date || place) {
    if(date) {
      fact.date = date;
    }
    if(place) {
      fact.place = place;
    }
    if(validate && !validate(fact)) {
      return;
    }
    extraction[type](fact);
  }
}

function getBirthDate(data) {
  const year = data.getText('birth year');
  const month = data.getText('birth month');
  const day = data.getText('birth day');
  return processDate(year, month, day);
}

function getBirthPlace(data) {
  const simple = data.getFirstText(['birth place', 'birth state', 'birth county']);
  if(simple) {
    return simple;
  }
  if(data.getText('subcategory') === 'Births & baptisms') {
    return getPlace(data);
  }
}

function getBaptismDate(data) {
  return processDate(
    data.getText('baptism year'),
    data.getText('baptism month'),
    data.getText('baptism day')
  );
}

function getBaptismPlace(data) {
  const simple = data.getText('baptism place');
  if(simple) {
    return simple;
  }
  if(data.getText('subcategory') === 'Births & baptisms') {
    return getPlace(data);
  }
}

function getDeathDate(data) {
  const year = data.getText('death year');
  const month = data.getText('death month');
  const day = data.getText('death day');
  return processDate(year, month, day);
}

function getDeathPlace(data) {
  const simple = data.getFirstText(['death place', 'death state']);
  if(simple) {
    return simple;
  }
  if(data.getText('subcategory') === 'Deaths & burials') {
    return getPlace(data);
  }
}

function getBurialDate(data) {
  return processDate(
    data.getText('burial year'), 
    data.getText('burial month'), 
    data.getText('burial day')
  );
}

function getMarriageDate(data) {
  const year = data.getText('marriage year');
  const month = data.getText('marriage month');
  const day = data.getText('marriage day');
  return processDate(year, month, day);
}

function getMarriagePlace(data) {
  const simple = data.getFirstText(['marriage place', 'marriage state']);
  if(simple) {
    return simple;
  }
  if(data.getText('subcategory') === 'Marriages & divorces') {
    return getPlace(data);
  }
}

function getEmigrationDate(data) {
  return processDate(
    data.getText('departure year'),
    data.getText('departure month'),
    data.getText('departure day')
  );
}

function getEmigrationPlace(data) {
  return data.getText('departure port');
}

function getImmigrationDate(data) {
  // TODO: are there records that have an arrival month and day?
  return data.getText('arrival year');
}

function getImmigrationPlace(data) {
  // TODO: we need more examples to build a robust algorithm for piecing together the destination
  return data.getFirstText([
    'arrival place',
    'destination',
    'destination port',
    'destination country',
  ]);
}

function processHouseholdPerson(data) {
  const personId = getRecordId(data['']);
  extraction.Name({
    person: personId,
    given: data['first name(s)'],
    surname: data['last name'],
  });
  extraction.Gender({
    person: personId,
    gender: data['sex'] || data['gender'],
  });
  if(data['birth year'] || data['birth place']) {
    const birth = {
      person: personId,
    };
    if(data['birth year']) {
      birth.date = data['birth year'];
    }
    if(data['birth place']) {
      birth.place = data['birth place'];
    }
    extraction.Birth(birth);
  }
  if(data['occupation']) {
    extraction.Occupation({
      person: personId,
      value: data['occupation'],
    });
  }
  if(data['marital status']) {
    extraction.MaritalStatus({
      person: personId,
      value: data['marital status'],
    });
  }
  return personId;
}
