import Extraction from '../Extraction.js';

const extraction = new Extraction('openarchives');
extraction.start();

extract()
  .then(() => extraction.end())
  .catch((error) => {
    console.error(error);
    extraction.end();
  });

async function extract() {
  const params = new URLSearchParams(window.location.search);
  const res = await fetch(`https://api.openarch.nl/1.0/records/show.json?archive=${params.get('archive')}&identifier=${params.get('identifier')}`);
  if (!res.ok) {
    throw new Error('could not fetch data');
  }

  const json = await res.json();
  const data = json[0];

  // Persons
  for (const rawPerson of data.a2a_Person) {
    const person = rawPerson.pid;
    extraction.Person({id: person});

    if (rawPerson.a2a_PersonName) {
      const rawName = rawPerson.a2a_PersonName;
      let name = '';

      if (rawName.a2a_PersonNameFirstName && rawName.a2a_PersonNameFirstName.a2a_PersonNameFirstName) {
        name += rawName.a2a_PersonNameFirstName.a2a_PersonNameFirstName + ' ';
      }

      if (rawName.a2a_PersonNameLastName && rawName.a2a_PersonNameLastName.a2a_PersonNameLastName) {
        name += rawName.a2a_PersonNameLastName.a2a_PersonNameLastName;
      }

      name = name.trim();
      if (name) {
        extraction.Name({person, name});
      }
    }

    let birthDate = getDate(rawPerson.a2a_BirthDate);
    let birthPlace = getPlace(rawPerson.a2a_BirthPlace);
    if (birthDate || birthPlace) {
      extraction.Birth({person, date: birthDate, place: birthPlace, parents: []});
    }

    let deathDate = getDate(rawPerson.a2a_DeathDate);
    let deathPlace = getPlace(rawPerson.a2a_DeathPlace);
    if (deathDate || deathPlace) {
      extraction.Death({person, date: deathDate, place: deathPlace});
    }
  }

  // Event/Relationships
  const eventDate = getDate(data.a2a_Event.a2a_EventDate);
  const eventPlace = getPlace(data.a2a_Event.a2a_EventPlace);
  const type = data.a2a_Event.a2a_EventType.a2a_EventType;
  let relationships = data.a2a_RelationEP;
  if (!Array.isArray(relationships)) {
    relationships = [relationships];
  }
  const child = getRelationshipPerson(relationships, 'Kind');
  const mother = getRelationshipPerson(relationships, 'Moeder');
  const father = getRelationshipPerson(relationships, 'Vader');
  const parents = [];
  if (mother) {
    parents.push(mother);
  }
  if (father) {
    parents.push(father);
  }
  const bride = getRelationshipPerson(relationships, 'Bruid');
  const groom = getRelationshipPerson(relationships, 'Bruidegom');
  const brideMother = getRelationshipPerson(relationships, 'Moeder van de bruid');
  const brideFather = getRelationshipPerson(relationships, 'Vader van de bruid');
  const groomMother = getRelationshipPerson(relationships, 'Moeder van de bruidegom');
  const groomFather = getRelationshipPerson(relationships, 'Vader van de bruidegom');
  const brideParents = [];
  if (brideMother) {
    brideParents.push(brideMother);
  }
  if (brideFather) {
    brideParents.push(brideFather);
  }
  const groomParents = [];
  if (groomMother) {
    groomParents.push(groomMother);
  }
  if (groomFather) {
    groomParents.push(groomFather);
  }
  const deceased = getRelationshipPerson(relationships, 'Overledene');

  // Emit the event
  switch(type) {
    // Birth
    // https://www.openarch.nl/show.php?archive=gld&identifier=2C973D9B-2A24-4E97-AC48-19C3A00C9D1A&lang=en&200
    case 'Geboorte':
      extraction.Birth({person: child, date: eventDate, place: eventPlace, parents});
      break;
    // Baptism
    // https://www.openarch.nl/show.php?archive=elo&identifier=f0b964b5-2d86-b61e-66b1-fcbd25b9c47c&lang=en
    case 'Doop':
      extraction.Baptism({person: child, date: eventDate, place: eventPlace});
      if (parents.length > 0) {
        extraction.Birth({person: child, parents});
      }
      break;
    // Marriage
    // https://www.openarch.nl/show.php?archive=rzh&identifier=7a9488e8-91bf-4961-b328-bb30915b9069&lang=en
    case 'Huwelijk':
      extraction.Marriage({date: eventDate, place: eventPlace, spouses: [bride, groom]});
      if (brideParents.length > 0) {
        extraction.Birth({person: bride, parents: brideParents});
      }
      if (groomParents.length > 0) {
        extraction.Birth({person: groom, parents: groomParents});
      }
      break;
    // Death
    // https://www.openarch.nl/show.php?archive=elo&identifier=7b85fbb6-31e4-7867-00ec-c6514baa31b9&lang=en
    case 'Overlijden':
      extraction.Death({person: deceased, date: eventDate, place: eventPlace});
      if (parents.length > 0) {
        extraction.Birth({person: deceased, parents});
      }
      break;
    // Burial
    // https://www.openarch.nl/show.php?archive=elo&identifier=09d0bfb0-fbba-943d-63f1-093f7f01439c&lang=en
    case 'Begraven':
      extraction.Burial({person: deceased, date: eventDate, place: eventPlace});
      if (parents.length > 0) {
        extraction.Birth({person: deceased, parents});
      }
      break;
  }

  extraction.Citation({
    title: document.title,
    url: window.location.href,
    accessed: Date.now(),
    repository_name: 'openarchives',
    repository_website: 'openarch.nl',
    repository_url: 'https://www.openarch.nl',
  });
}

/* Helper Functions */

function getDate(rawDate) {
  let date = undefined;
  if (rawDate) {
    if (rawDate.a2a_Year && rawDate.a2a_Year.a2a_Year) {
      date = rawDate.a2a_Year.a2a_Year;
    }
    if (rawDate.a2a_Month && rawDate.a2a_Month.a2a_Month) {
      date += '-' + rawDate.a2a_Month.a2a_Month;
    }
    if (rawDate.a2a_Day && rawDate.a2a_Day.a2a_Day) {
      date += '-' + rawDate.a2a_Day.a2a_Day;
    }
  }
  return date;
}

function getPlace(rawPlace) {
  let place = undefined;
  if (rawPlace) {
    if (rawPlace.a2a_Place && rawPlace.a2a_Place.a2a_Place) {
      place = rawPlace.a2a_Place.a2a_Place;
    }
  }

  return place;
}

function getRelationshipPerson(relationships, type) {
  for (const relationship of relationships) {
    if (relationship.a2a_RelationType.a2a_RelationType === type) {
      return relationship.a2a_PersonKeyRef.a2a_PersonKeyRef;
    }
  }

  return undefined;
}
