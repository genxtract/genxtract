import Extraction from '../Extraction.js';
import Emit from '../Emit.js';
import { maybe } from '../lib/utils.js';
import schema from '../lib/schema.js';

const prefixes = [
  'dr',
  'dr.',
  'president',
  'general',
];

const suffixes = [
  'jr',
  'jr.',
  'sr',
  'sr.',
  'iii',
];

const extraction = new Extraction('wikitree-person');
const emit = new Emit(extraction);

extraction.start();

const $schemaPersons = Array.from(schema.queryItemAll(document, 'https://schema.org/Person'));

if($schemaPersons.length) {

  // Process the primary person

  const $primaryPerson = $schemaPersons.shift();
  const personId = getRecordId(document.location.href);
  emit.Person({
    id: personId,
    primary: true,
  });

  emit.Name({
    person: personId,
    prefix: maybe(schema.queryProp($primaryPerson, 'honorificPrefix')).textContent,
    given: maybe(schema.queryProp($primaryPerson, 'givenName')).textContent,
    surname: schema.queryPropContent($primaryPerson, 'familyName'),
    suffix: maybe(schema.queryProp($primaryPerson, 'honorificSuffix')).textContent,
  });

  switch(schema.queryPropContent($primaryPerson, 'gender')) {
    case 'male':
      emit.Gender({
        person: personId,
        gender: 'Male',
      });
      break;
    case 'female':
      emit.Gender({
        person: personId,
        gender: 'Female',
      });
      break;
  }

  processEvent(emit, personId, $primaryPerson, 'birth', 'Birth');
  processEvent(emit, personId, $primaryPerson, 'death', 'Death');

  // Process all other persons
  $schemaPersons.forEach(($relative) => {
    
    const url = $relative.querySelector('a').href;
    const relativeId = getRecordId(url);
    emit.Person({
      id: relativeId,
    });
    
    const $name = schema.queryProp($relative, 'name');
    const name = $name ? $name.textContent : null;
    if(name) {
      processNames(name).forEach((name) => {
        name.person = relativeId;
        emit.Name(name);
      });
    }

    switch($relative.getAttribute('itemprop')) {
      
      case 'parent':
        emit.Birth({
          person: personId,
          parents: [relativeId],
        });
        break;
        
      case 'spouse':
        emit.Marriage({
          spouses: [personId, relativeId],
        });
        // TODO: get marriage date and place
        break;
        
      case 'children':
        emit.Birth({
          person: relativeId,
          parents: [personId],
        });
        break;
    }

  });

}

emit.Citation({
  title: document.title,
  url: window.location.href,
  accessed: Date.now(),
  repository_name: 'WikiTree',
  repository_website: 'wikitree.com',
  repository_url: 'https://www.wikitree.com',
});

extraction.end();

/**
 * Get the specified event data, if it exists
 * 
 * @param {Emitter} emit
 * @param {String} personId
 * @param {Element} $element DOM Element to search inside of
 * @param {String} event Event name
 * @param {String} type GedcomX fact type
 */
function processEvent(emit, personId, $element, event, type) {
  const $place = schema.queryProp($element, event + 'Place');
  const $address = $place ? schema.queryProp($place, 'address') : null;
  const $date = schema.queryProp($element, event + 'Date');
  
  if($address || $date) {
    const event = {
      person: personId,
    };
    if($address) {
      event.place = $address.textContent;
    }
    if($date) {
      event.date = $date.textContent;
    }
    emit[type](event);
  }
}

/**
 * Split a name into parts
 * 
 * TODO: request that wikitree specify the name parts in the schema.org data
 * 
 * @param {String} name
 * @return {Array}
 */
function processNames(name) {
  const partsList = name.split(' ');
  const names = [];
  let prefix, potentialPrefix,
      suffix, potentialSuffix,
      givenName, familyName, maidenName,
      i;
  
  // Check for a prefix
  potentialPrefix = partsList[0].toLowerCase();
  for(i = 0; i < prefixes.length; i++) {
    if(prefixes[i] === potentialPrefix) {
      prefix = partsList.shift();
      break;
    }
  }
  
  // Check for a suffix
  potentialSuffix = partsList[partsList.length - 1].toLowerCase();
  for(i = 0; i < suffixes.length; i++) {
    if(suffixes[i] === potentialSuffix) {
      suffix = partsList.pop();
      break;
    }
  }
  
  // Check for a maiden name
  for(i = 0; i < partsList.length; i++) {
    if(/^\([^)]+\)$/.test(partsList[i])) {
      
      // Remove leading and trailing ()
      maidenName = partsList[i].slice(1, -1);
      
      // Remove the name from the list
      partsList.splice(i, 1);
      
      break;
    }
  }
  
  // At this point we have a list of given name and family names. We don't know
  // how many we have of each. The best assumption we can make is that if there
  // is more than one name then the last one will be a family name and all others
  // are given names. It will often fail, but any other method will fail more.
  
  // If there are no names left then do nothing.
  // This code is useless except for its ability to document that we are
  // intentionally doing nothing.
  if(partsList.length === 0) {
    
  }
  
  // If there's one name then assume it's a given name
  else if(partsList.length === 1) {
    givenName = partsList[0];
  }
  
  // We have more than one name left so assume the last one is a family name
  else {
    familyName = partsList.pop();
    givenName = partsList.join(' ');
  }
  
  // Now we're ready to assemble names
  if(maidenName) {
    names.push({
      prefix,
      given: givenName,
      surname: maidenName,
      suffix,
    });
  }
  
  names.push({
    prefix,
    given: givenName,
    surname: familyName,
    suffix,
  });
  
  return names;
}

/**
 * Get the record ID
 * 
 * @param {String} url
 * @return {String}
 */
function getRecordId(url) {
  return url.split('/').pop();
}
