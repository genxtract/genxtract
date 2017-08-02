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
    type: 'Death',
    date: /^(death date|died)$/,
    place: /^(death place)$/,
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

  // Father
  const $father = dataTable.getMatch(/^father('s)?( name)?$/);
  if($father) {
    const fatherId = getRelativesRecordId($father, `${personId}-father`);
    parents.push(fatherId);
    emit.Person({
      id: fatherId,
    });
    emit.Name({
      person: fatherId,
      name: $father.textContent.trim(),
    });
    if(dataTable.hasMatch(/^father('s)? (birthplace|place of birth)$/)) {
      emit.Birth({
        person: fatherId,
        place: dataTable.getMatchText(/^father('s)? (birthplace|place of birth)$/),
      });
    }
  }
  
  // Mother
  const $mother = dataTable.getMatch(/^mother('s)?( name)?$/);
  if($mother) {
    const motherId = getRelativesRecordId($mother, `${personId}-mother`);
    parents.push(motherId);
    emit.Person({
      id: motherId,
    });
    emit.Name({
      person: motherId,
      name: $mother.textContent.trim(),
    });
    if(dataTable.hasMatch(/^mother('s)? (birthplace|place of birth)$/)) {
      emit.Birth({
        person: motherId,
        place: dataTable.getMatchText(/^mother('s)? (birthplace|place of birth)$/),
      });
    }
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
    const spouseId = getRelativesRecordId($spouse, `${personId}-spouse`) ;
    
    emit.Person({
      id: spouseId,
    });
    emit.Name({
      person: spouseId,
      name: $spouse.textContent.trim(),
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
  }

  // Children
  if(dataTable.hasLabel('children')) {
    // TODO: are there ever records that list children with links to the childrens' records?
    // Here we are assuming they are always just text.
    dataTable.getText('children').split('; ').forEach(function(name, i) {
      const childId = `${personId}-child-${i+1}`;
      emit.Person({
        id: childId,
      });
      emit.Name({
        person: childId,
        name,
      });
    });
  }
  
  // TODO: siblings; see web obituary test; how do we detect and handle "of {PLACE}" strings?

}

emit.Citation({
  title: document.title,
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
