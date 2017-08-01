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
        emit.Person({
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
 * Create a GedcomX Fact from a fact card
 * 
 * @param {HTMLElement} $card
 * @param {String} factType
 * @return {{date,place}}
 */
function cardToFact($card, factType) {
  const $date = $card.querySelector('.factItemDate');
  const date = $date ? toTitleCase($date.textContent.trim()) : null;
  const $place = $card.querySelector('.factItemLocation');
  const place = $place ? $place.textContent.trim() : null;
  return {date, place};
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
