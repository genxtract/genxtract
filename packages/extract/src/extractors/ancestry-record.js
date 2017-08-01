import Extraction from '../Extraction.js';
import Emit from '../Emit.js';
import HorizontalTable from '../lib/HorizontalTable.js';
import VerticalTable from '../lib/VerticalTable.js';

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
