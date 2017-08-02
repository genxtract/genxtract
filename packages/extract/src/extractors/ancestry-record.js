import Extraction from '../Extraction.js';
import Emit from '../Emit.js';
import HorizontalTable from '../lib/HorizontalTable.js';
import VerticalTable from '../lib/VerticalTable.js';
import {maybe} from '../lib/utils.js';

const eventsConfig = [
  {
    type: 'Birth',
    date: /^(birth year|birth date|born)$/,
    place: /^(birth ?place)$/,
  },
  {
    type: 'Baptism',
    date: /^(baptism date|died)$/,
    place: /^(baptism place)$/,
  },
  {
    type: 'Death',
    date: /^(death date|died)$/,
    place: /^(death place)$/,
  },
  {
    type: 'Burial',
    date: /^(burial date|died)$/,
    place: /^(burial place)$/,
  },
  {
    type: 'Immigration',
    date: /^arrival date$/,
    place: /^port of arrival$/,
  },
  {
    type: 'Emigration',
    date: /^departure date$/,
    place: /^port of departure/,
  },
];

const factsConfig = [
  {
    regex: /^(color or )?race$/,
    type: 'Race',
  },
  {
    regex: /^ethnicity\/ nationality$/,
    type: 'Ethnicity',
  },
  {
    label: 'marital status',
    type: 'MaritalStatus',
  },
  {
    label: 'ssn',
    type: 'NationalId',
  },
];

const extraction = new Extraction('ancestry-record');
const emit = new Emit(extraction);

const dataTable = new HorizontalTable(document.getElementById('recordData'), {
  rowSelector: '.tableHorizontal > tbody > tr',
  labelMapper: function(label) {
    return label.toLowerCase().replace(/:$/, '');
  }, 
});

// An index of relatives we've added. Keys are the relative's name
// and the values are the ID we used the first time they were emitted.
// This index is needed for matching up household persons with those added
// from the main table. It's common for parents from census records
// to be listed in the main table as well as the household table.
// We have to process both because relationships aren't included in
// the household table. If they were then we could process the household
// table first and ignore relationships in the main table that have
// already been added, but alas we can't do that.
const relativesIndex = {};

extraction.start();

if(dataTable.hasData()) {

  const personId = getRecordId(window.location.href);
  emit.Person({
    id: personId,
    primary: true,
  });

  // Name
  dataTable.getText('name').trim().split(/\[|\]/g).forEach(function(name) {
    emit.Name({
      person: personId,
      name,
    });
  });

  // Split names
  const given = dataTable.getText('given name');
  const surname = dataTable.getText('surname');
  if(given || surname) {
    emit.Name({
      person: personId,
      given,
      surname,
    });
  }

  // Gender
  if(dataTable.hasMatch(/gender|sex/)) {
    const gender = getGender(dataTable.getMatchText(/gender|sex/));
    if(gender) {
      emit.Gender({
        person: personId,
        gender,
      });
    }
  }
  
  // Events
  eventsConfig.forEach(function(config) {
    const date = dataTable.getMatchText(config.date);
    const place = dataTable.getMatchText(config.place);
    if(date || place) {
      emit[config.type]({
        person: personId,
        date, 
        place,
      });
    }
  });
  
  // Residence
  dataTable.getLabelsMatch(/^(home|residence) in \d{4}$/).forEach(function(homeLabel) {
    const year = homeLabel.replace(/^(home|residence) in /, '');
    emit.Residence({
      person: personId,
      date: year,
      place: dataTable.getText(homeLabel),
    });
  });
  
  // Simple Facts
  factsConfig.forEach(function(config) {
    if(config.label && dataTable.hasLabel(config.label)) {
      emit[config.type]({
        person: personId,
        value: dataTable.getText(config.label),
      });
    }
    
    else if(config.regex && dataTable.hasMatch(config.regex)) {
      emit[config.type]({
        person: personId,
        value: dataTable.getMatchText(config.regex),
      });
    }
  });

  //
  // Family
  //
  
  const parents = [];
  const childrensParents = [personId];

  // Father
  const $father = dataTable.getMatch(/^father('s)?( name)?$/);
  if($father) {
    const fatherId = getRelativesRecordId($father, `${personId}-father`);
    const fatherName = $father.textContent.trim();
    parents.push(fatherId);
    emit.Name({
      person: fatherId,
      name: fatherName,
    });
    if(dataTable.hasMatch(/^father('s)? (birthplace|place of birth)$/)) {
      emit.Birth({
        person: fatherId,
        place: dataTable.getMatchText(/^father('s)? (birthplace|place of birth)$/),
      });
    }
    relativesIndex[fatherName] = fatherId;
  }
  
  // Mother
  const $mother = dataTable.getMatch(/^mother('s)?( name)?$/);
  if($mother) {
    const motherId = getRelativesRecordId($mother, `${personId}-mother`);
    const motherName = $mother.textContent.trim();
    parents.push(motherId);
    emit.Name({
      person: motherId,
      name: motherName,
    });
    if(dataTable.hasMatch(/^mother('s)? (birthplace|place of birth)$/)) {
      emit.Birth({
        person: motherId,
        place: dataTable.getMatchText(/^mother('s)? (birthplace|place of birth)$/),
      });
    }
    relativesIndex[motherName] = motherId;
  }

  if(parents.length) {
    emit.Birth({
      person: personId,
      parents,
    });
  }

  // Spouse
  const $spouse = dataTable.getMatch(/^spouse('s)?( name)?$/);
  if($spouse) {
    const spouseId = getRelativesRecordId($spouse, `${personId}-spouse`);
    const spouseName = $spouse.textContent.trim();
    
    emit.Name({
      person: spouseId,
      name: spouseName,
    });
    
    if(dataTable.hasLabel('spouse gender')) {
      emit.Gender({
        person: spouseId,
        gender: getGender(dataTable.getText('spouse gender')),
      });
    }
    
    const marriage = {
      spouses: [personId, spouseId],
    };
    
    // Marriage
    // TODO: is it possible for a event to be listed without a spouse? If so
    // then this code block won't detect it
    const marriageDate = dataTable.getText('marriage date');
    const marriagePlace = dataTable.getText('marriage place');
    if(marriageDate) {
      marriage.date = marriageDate;
    }
    if(marriagePlace) {
      marriage.place = marriagePlace;
    }

    emit.Marriage(marriage);
    childrensParents.push(spouseId);

    relativesIndex[spouseName] = spouseId;
  }

  // Children
  if(dataTable.hasLabel('children')) {
    // TODO: are there ever records that list children with links to the childrens' records?
    // Here we are assuming they are always just text.
    dataTable.getText('children').split('; ').forEach(function(name, i) {
      const childId = `${personId}-child-${i+1}`;
      emit.Name({
        person: childId,
        name,
      });
      emit.Birth({
        person: childId,
        parents: childrensParents,
      });
      relativesIndex[name] = childId;
    });
  }
  
  // TODO: siblings; see web obituary test; how do we detect and handle "of {PLACE}" strings?

  // Process household persons
  if(dataTable.hasLabel('household members')) {
    const householdTable = new VerticalTable(dataTable.getValue('household members'), {
      labelMapper: function(label) {
        return label.toLowerCase();
      },
      valueMapper: function(cell) {
        const a = cell.querySelector('a');
        return {
          text: cell.textContent.trim(),
          href: a ? a.href : '',
        };
      },
    });

    const recordYear = getRecordYear();
    
    householdTable.getRows().forEach(function(rowData) {
      
      // There's no point in processing this data if there isn't at least a name
      if(rowData.name) {
        
        // Check to see if we've already added this person. Parents are often
        // explicitly listed in the data table which we process above.
        const name = rowData.name.text;
        const relativeId = getRecordId(rowData.name.href);
        const existingPerson = relativesIndex[name];
        
        // Update an existing person's IDs
        if(existingPerson) {
          emit.AlternateId({
            person: existingPerson,
            id: relativeId,
            preferred: true,
          });
        } 
        
        // Create a new person
        else {
          emit.Name({
            person: relativeId,
            name,
          });
        }
        
        // Primary person already has birth year extracted
        // TODO: enhance to check whether the primary person actually has
        // a birth fact; right now we're just assuming since Ancestry
        // usually calculates an estimated age for us
        if(relativeId !== personId) {
          const age = parseInt(rowData.age.text, 10);
          if(!isNaN(age) && recordYear) {
            const estimatedBirthYear = recordYear - age;
            emit.Birth({
              person: relativeId,
              date: `about ${estimatedBirthYear}`,
            });
          }
        }
      }
    });
  }
  
  // Handle FamilySearch style events labeled as "Event Type","Event Date","Event Place"
  // We do this last so that we can properly attach any relationship events
  if(dataTable.hasLabel('event type')) {
    const otherEventType = dataTable.getText('event type');
    const otherEventDate = dataTable.getText('event date');
    const otherEventPlace = dataTable.getText('event place');
    if(otherEventType && emit[otherEventType] && (otherEventDate || otherEventPlace)) {
      const otherEvent = {};
      if(otherEventDate) {
        otherEvent.date = otherEventDate;
      }
      if(otherEventPlace) {
        otherEvent.place = otherEventPlace;
      }
      if(otherEventType === 'Marriage') {
        otherEvent.spouses = childrensParents;
        emit.Marriage(otherEvent);
      } else {
        emit[otherEventType](otherEvent);
      }
    }
  }

}

emit.Citation({
  title: getTitle(),
  url: window.location.href,
  accessed: Date.now(),
  repository_name: 'Ancestry',
  repository_website: 'ancestry.com',
  repository_url: 'http://www.ancestry.com',
});

extraction.end();

/**
 * Given the URL of a record, return an ID of the format ${dbID}-${recordID}.
 * 
 * Example URL: http://search.ancestry.com/cgi-bin/sse.dll?indiv=1&dbid=7602&h=73219065
 * 
 * @param {String} url
 * @return {String}
 */
function getRecordId(url) {
  const params = new URLSearchParams(new URL(url).search);
  return (params.get('dbid') || params.get('db')) + '-' + params.get('h');
}

/**
 * Get the record ID of a relative, if possible.
 * 
 * @param {Element} $relative
 * @param {String=} defaultId
 * @return {String}
 */
function getRelativesRecordId($relative, defaultId) {
  const a = $relative.querySelector('a');
  const url = maybe(a).href;
  return url ? getRecordId(url) : defaultId;
}

/**
 * Translate a string into a GedcomX gender type
 * 
 * @param {String} gender
 * @return {String}
 */
function getGender(gender) {
  switch(gender) {
    case 'M':
    case 'M (Male)':
    case 'Male':
      return 'Male';
    case 'F':
    case 'F (Female)':
    case 'Female':
      return 'Female';
  }
}

/**
 * Attempt to calculate a year for the record.
 * 
 * Right now it just tries to get a year (4-digit number) from the title.
 * 
 * @return {Integer}
 */
function getRecordYear() {
  const title = getTitle();
  const matches = title.match(/\d{4}/g);
  if(matches.length === 1) {
    return parseInt(matches[0], 10);
  }
}

/**
 * Get the record title
 * 
 * @returns {String}
 */
function getTitle() {
  return document.querySelector('h1').textContent.replace(/\s/g, ' ').trim();
}
