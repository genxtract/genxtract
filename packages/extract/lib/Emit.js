class Emit {
  constructor(extraction) {
    this.extraction = extraction;
  }

  person({id, primary}) {
    if (!id) {
      return this.extraction.error(new Error('person missing id'));
    }
    this.extraction.data({
      type: 'Person',
      data: {
        id,
        primary,
      }
    });
  }

  name({person, name}) {
    if (!person) {
      return this.extraction.error(new Error('name missing person'));
    }
    if (!name) {
      return this.extraction.error(new Error('name missing name'));
    }
    this.extraction.data({
      type: 'Name',
      data: {
        person,
        name,
      }
    });
  }

  gender({person, gender}) {
    if (!person) {
      return this.extraction.error(new Error('gender missing person'));
    }
    if (!gender) {
      return this.extraction.error(new Error('gender missing gender'));
    }
    this.extraction.data({
      type: 'Gender',
      data: {
        person,
        gender,
      }
    });
  }

  birth({person, place, date}) {
    if (!person) {
      return this.extraction.error(new Error('birth missing person'));
    }
    this.extraction.data({
      type: 'Birth',
      data: {
        person,
        place,
        date,
      }
    });
  }

  marriage({persons, place, date}) {
    if (!persons || !Array.isArray(persons) || persons.length === 0) {
      return this.extraction.error(new Error('marriage missing person'));
    }
    this.extraction.data({
      type: 'Marriage',
      data: {
        persons,
        place,
        date,
      }
    });
  }

  death({person, place, date}) {
    if (!person) {
      return this.extraction.error(new Error('death missing person'));
    }
    this.extraction.data({
      type: 'Death',
      data: {
        person,
        place,
        date,
      }
    });
  }
}

export default Emit;
