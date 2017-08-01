import Extraction from '../Extraction.js';
import Emit from '../Emit.js';
import {parseHtml, toTitleCase} from '../lib/utils.js';

const eventConfig = [
  {
    label: 'birth',
    type: 'Birth',
  },
  {
    label: 'christening',
    type: 'Christening',
  },
  {
    label: 'death',
    type: 'Death',
  },
  {
    label: 'arrival',
    type: 'Immigration',
  },
  {
    label: 'departure',
    type: 'Emigration',
  },
  {
    label: 'residence',
    type: 'Residence',
  },
];

const extraction = new Extraction('ancestry-person');
const emit = new Emit(extraction);

extraction.start();
run()
  .then(() => extraction.end())
  .catch((error) => {
    console.error(error);
    extraction.end();
  });

async function run() {

  // We start on a url such as https://www.ancestry.com/family-tree/person/tree/109528628/person/180077026601/facts.
  // We want to strip anything after the second number and replace it with /content/factsbody
  const factsUrl = window.location.pathname.split('/').slice(0, 7).join('/') + '/content/factsbody';

  const res = await fetch(factsUrl, {
    credentials: 'include',
  });
  if(!res.ok) {
    throw new Error(`Error featching ${factsUrl}`);
  }

  const json = await res.json();
  if(json.HasError) {
    throw new Error(json.ErrorMessage);
  }
  if(!json.html.body) {
    throw new Error('No HTML body');
  }

  process(parseHtml(json.html.body));

  emit.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'Ancestry Public Trees',
    repository_website: 'www.ancestry.com',
    repository_url: 'https://www.ancestry.com',
  });

}

/**
 * Process the HTML dom returned by the factsbody API call
 * 
 * @param {Element} $html
 */
function process($html) {
  
  const personId = getRecordId(window.location.href);
  emit.Person({
    id: personId,
    primary: true,
  });

  const facts = new FactsList($html);

  // Here we only handle known genders and thus intentionally
  // ignore unknown gender types (including 'Unknown')
  if(facts.hasFact('gender')) {
    const gender = facts.getFirstText('gender');
    switch(gender) {
      case 'Female':
      case 'Male':
        emit.Gender({
          person: personId,
          gender,
        });
    }
  }

  // Names of the primary person
  facts.getCardTitles('name').forEach((nameText) => {
    emit.Name({
      person: personId,
      name: nameText,
    });
  });

  // Events of the primary person
  eventConfig.forEach((config) => {
    if(facts.hasFact(config.label)) {
      facts.getFacts(config.label, config.type).forEach((fact) => {
        fact.person = personId;
        emit[config.type](fact);
      });
    }
  });

  //
  // Relationships
  //

  const relLists = getRelLists($html);

  // Parents
  relLists.parents.forEach(function($parentsList) {
    const $parents = $parentsList.querySelectorAll('.card');
    const $father = $parents[0];
    const $mother = $parents[1];
    let fatherId = null;
    let motherId = null;
    
    // Create parents and parent-child relationships
    
    if(!$father.classList.contains('cardEmpty')) {
      fatherId = getPersonFromCard($father);
    }
    
    if(!$mother.classList.contains('cardEmpty')) {
      motherId = getPersonFromCard($mother);
    }
    
    // Create couple relationship if both the father and mother exist
    if(fatherId && motherId) {
      emit.Marriage({
        spouses: [fatherId, motherId],
      });
      emit.Birth({
        person: personId,
        parents: [fatherId, motherId],
      });
    } else if(fatherId) {
      emit.Birth({
        person: personId,
        parents: [fatherId],
      });
    } else if(motherId) {
      emit.Birth({
        person: personId,
        parents: [motherId],
      });
    }
    
  });

  // TODO: siblings and half-siblings

  // Spouses and Children
  relLists.spouses.forEach(function($spouseList) {
    const $children = Array.from($spouseList.querySelectorAll('.card'));
    const $spouse = $children.shift();
    const parents = [personId];

    if(!$spouse.classList.contains('cardEmpty')) {
      const spouseId = getPersonFromCard($spouse);
      const marriage = {
        spouses: [personId, spouseId],
      };

      // Try to find a marriage event from the facts list
      // so that we can get the marriage date and place, if possible
      const spouseName = getPersonName($spouse);
      facts.getCards('marriage').forEach(function($marriage) {
        const $spouseName = $marriage.querySelector('.userPerson');
        if($spouseName && $spouseName.textContent === spouseName) {
          Object.assign(marriage, cardToFact($marriage));
        }
      });

      emit.Marriage(marriage);
      parents.push(spouseId);
    }
    
    $children.forEach(function($childCard) {
      const childId = getPersonFromCard($childCard);
      emit.Birth({
        person: childId,
        parents,
      });
    });
  });

}

/**
 * Given the URL of a person, return an ID of the format `${treeId}-${personId}`.
 * 
 * Example URL: https://www.ancestry.com/family-tree/person/tree/109528628/person/180077026601/facts
 * Resulting ID: '109528628-180077026601'
 * 
 * @param {String} url
 * @return {String}
 */
function getRecordId(url) {
  const parts = url.split('/');
  return parts[6] + '-' + parts[8];
}

/**
 * Return the first immediate child text node of an HTML element
 * 
 * @param {HTMLElement} $element
 * @return {String}
 */
function firstChildText($element) {
  for (let i = 0; i < $element.childNodes.length; i++) {
    const curNode = $element.childNodes[i];
    if (curNode.nodeName === '#text') {
      return curNode.nodeValue.trim();
    }
  }
}

/**
 * Create a fact from a card
 * 
 * @param {HTMLElement} $card
 * @return {{date,place}}
 */
function cardToFact($card) {
  const $date = $card.querySelector('.factItemDate');
  const date = $date ? toTitleCase($date.textContent.trim()) : null;
  const $place = $card.querySelector('.factItemLocation');
  const place = $place ? $place.textContent.trim() : null;
  return {date, place};
}

/**
 * Get all relationship lists separated into categories: parents, siblings, halfsiblings, spouses
 * 
 * @param {HTMLElement} $dom
 * @return {{parents: Array, siblings: Array, halfsiblings: Array, spouses: Array}}
 */
function getRelLists($dom) {
  const lists = {
    
    // Right now Ancestry only shows one set of parents. We assume multiple
    // in case that changes in the future (it really should).
    'parents': [],
    
    // Since we only have one set of parents we also only have one set of siblings
    'siblings': [],
    
    // I don't know that we can do anything with half siblings
    'halfsiblings': [],
    
    // Spouses lists include children
    'spouses': [],
  };
  
  // Get subtitles so that we know which type of list we're looking at
  const $familySection = $dom.querySelector('#familySection');
  const familyNodes = $familySection.querySelectorAll('.factsSubtitle, .researchList, .toggleSiblingsButton');
  let currentNode = null;
  let listType = 'parents';

  for(let i = 0; i < familyNodes.length; i++) {
    currentNode = familyNodes[i];
    
    // Subtitle
    if(currentNode.classList.contains('factsSubtitle')) {
      switch(currentNode.textContent.toLowerCase()) {
        case 'parents':
          listType = 'parents';
          break;
        case 'half siblings':
          listType = 'halfsiblings';
          break;
        case 'spouse':
        case 'spouse & children':
          listType = 'spouses';
          break;
      }
    }
    
    // Siblings button
    else if(currentNode.classList.contains('toggleSiblingsButton')) {
      listType = 'siblings';
    }
    
    // List
    else if(currentNode.classList.contains('researchList')) {
      lists[listType].push(currentNode);
    }
  }
  
  return lists;
}

/**
 * Processes and emits the person from the card then returns their ID.
 * 
 * @param {HTMLElement} $card
 * @return {String} person ID
 */
function getPersonFromCard($card) {
  const personId = getRecordId($card.href);
  emit.Person({
    id: personId,
  });

  emit.Name({
    person: personId,
    name: getPersonName($card),
  });

  const $lifespan = $card.querySelector('.userCardSubTitle');
  if($lifespan) {
    const lifespanParts = $lifespan.textContent.trim().split('–');
    const birthYear = lifespanParts[0];
    const deathYear = lifespanParts[1];
    if(birthYear) {
      emit.Birth({
        person: personId,
        date: birthYear,
      });
    }
    if(deathYear) {
      emit.Death({
        person: personId,
        date: deathYear,
      });
    }
  }
  return personId;
}

/**
 * Get the name from a family member card
 * 
 * @param {HTMLElement} card
 * @return {String}
 */
function getPersonName(card) {
  return firstChildText(card.querySelector('.userCardTitle'));
}

/**
 * Process the list of facts. Enable quick extraction of data.
 */
class FactsList {
  
  /**
   * @param {HTMLElement} $dom - A DOM element that the facts list can be found inside of.
   */
  constructor($dom) {
  
    // Gather list of events. Store in map keyed by event title.
    // Each value is a list of events because events can occur multiple times
    // and even events that should occur only once (birth) may be documented
    // multiple times if documents provide conflicting values.
    this.facts = {};
    
    Array.from($dom.querySelectorAll('#factsSection .LifeEvent')).forEach((card) => {
      // The element where the event name is found may have other data in it.
      // The event name is a plain text node where as the other data is
      // wrapped in another element. So we traverse the childNodes and look for
      // the first regular text node.
      const name = firstChildText(card.querySelector('.cardSubtitle')).trim().toLowerCase();
      if(typeof this.facts[name] === 'undefined') {
        this.facts[name] = [];
      }
      this.facts[name].push(card);
    });

  }
  
  /**
   * Get the DOM elements that represent the fact card for the given fact.
   * 
   * @param {String} factType
   * @return {HTMLElement[]}
   */
  getCards(factType) {
    return this.facts[factType] || [];
  }
  
  /**
   * Get the titles of fact cards.
   * 
   * @param {String} factType
   * @return {String[]}
   */
  getCardTitles(factType) {
    return this.getCards(factType).map(function(card) {
      return card.querySelector('.cardTitle').textContent.trim();
    });
  }
  
  /**
   * Get text value of first matching card
   * 
   * @param {String} factType
   * @return {String}
   */
  getFirstText(factType) {
    const card = this.getFirstCard(factType);
    if(card) {
      return card.querySelector('.cardTitle').textContent.trim();
    }
  }
  
  /**
   * Get first matching card
   * 
   * @param {String} factType
   * @return {HTMLElement}
   */
  getFirstCard(factType) {
    if(this.facts[factType]) {
      return this.facts[factType][0];
    }
  }
  
  /**
   * Check whether we have data for a given fact
   * 
   * @param {String} factType
   * @return {Boolean}
   */
  hasFact(factType) {
    return typeof this.facts[factType] !== 'undefined';
  }
  
  /**
   * Get GEDCOM X facts of the given type
   * 
   * @param {String} factType
   * @param {String} gedxType
   * @return {{date,place}}
   */
  getFacts(factType, gedxType) {
    return this.getCards(factType).map(function(card) {
      return cardToFact(card, gedxType);
    });
  }
    
}
