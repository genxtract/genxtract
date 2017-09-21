import Extraction from '@genxtract/extract/src/Extraction.js';
import GedcomX from './GedcomX.js';

let extraction;
let promise;

describe('GedcomX', () => {
  beforeEach(() => {
    extraction = new Extraction('test');
    const combinator = new GedcomX();
    promise = combinator.start();
    extraction.start();
  });

  it('basic person', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
        }],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Person({id: '1234'});

    extraction.end();
  });

  it('primary person', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          principle: true,
        }],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Person({id: '1234', primary: true});

    extraction.end();
  });

  it('gender', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          gender: {
            type: 'http://gedcomx.org/Male',
          },
        }],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Gender({person: '1234', gender: 'Male'});

    extraction.end();
  });

  it('name', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          names: [{
            nameForms: [{
              parts: [
                {type: 'http://gedcomx.org/Given', value: 'John'},
              ],
              fullText: 'John',
            }],
          }],
        },
        {
          id: '5678',
          names: [{
            nameForms: [{
              parts: [
                {type: 'http://gedcomx.org/Given', value: 'John C'},
                {type: 'http://gedcomx.org/Surname', value: 'Smith'},
              ],
              fullText: 'John C Smith',
            }],
          }],
        },
        {
          id: '910',
          names: [{
            nameForms: [{
              parts: [
                {type: 'http://gedcomx.org/Prefix', value: 'Sir'},
                {type: 'http://gedcomx.org/Given', value: 'Richard Charles Nicholas'},
                {type: 'http://gedcomx.org/Surname', value: 'Branson'},
                {type: 'http://gedcomx.org/Suffix', value: 'III'},
              ],
              fullText: 'Sir Richard Charles Nicholas Branson III',
            }],
          }],
        }],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Name({person: '1234', name: 'John'});
    extraction.Name({person: '1234', name: 'John'}); // making sure we ignore duplicate names
    extraction.Name({person: '5678', name: 'John C Smith'});
    extraction.Name({person: '5678', given: 'John C', surname: 'Smith'});
    extraction.Name({person: '910', prefix: 'Sir', given: 'Richard Charles Nicholas', surname: 'Branson', suffix: 'III'});

    extraction.end();
  });

  it('basic events/facts', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          facts: [
            {type: 'http://gedcomx.org/Baptism', place: {original: 'Somewhere'}},
            {type: 'http://gedcomx.org/Death', date: {original: 'Sometime'}},
            {type: 'http://gedcomx.org/Citizenship', value: 'Somewhere'},
          ],
        }],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Baptism({person: '1234', place: 'Somewhere'});
    extraction.Death({person: '1234', date: 'Sometime'});
    extraction.Citizenship({person: '1234', value: 'Somewhere'});

    extraction.end();
  });

  it('parent events', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [
          {
            id: '12',
            facts: [
              {type: 'http://gedcomx.org/Birth', place: {original: 'Somewhere'}},
            ],
          },
          {id: '34'},
          {id: '56'},
        ],
        relationships: [
          {
            type: 'http://gedcomx.org/ParentChild',
            person1: {resource: '#34'},
            person2: {resource: '#12'},
          },
          {
            type: 'http://gedcomx.org/ParentChild',
            person1: {resource: '#56'},
            person2: {resource: '#12'},
          },
        ],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Birth({person: '12', place: 'Somewhere', parents: ['34', '56']});

    extraction.end();
  });

  it('spouse events', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [
          {id: '12'},
          {id: '34'},
        ],
        relationships: [
          {
            type: 'http://gedcomx.org/Couple',
            person1: {resource: '#12'},
            person2: {resource: '#34'},
            facts: [
              {type: 'http://gedcomx.org/Marriage', place: {original: 'Somewhere'}},
            ],
          },
        ],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Marriage({spouses: ['12', '34'], place: 'Somewhere'});

    extraction.end();
  });

  it('citation', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        description: '#1',
        persons: [
          {
            id: '12',
            sources: [{description: '#1'}],
          },
          {id: '34', sources: [{description: '#1'}]},
        ],
        relationships: [
          {
            type: 'http://gedcomx.org/Couple',
            person1: {resource: '#12'},
            person2: {resource: '#34'},
            facts: [
              {type: 'http://gedcomx.org/Marriage', place: {original: 'Somewhere'}},
            ],
            sources: [{description: '#1'}],
          },
        ],
        agents: [{
          id: 'agent',
          names: [{lang: 'en', value: 'Example'}],
          homepage: {resource: 'http://example.com'},
        }],
        sourceDescriptions: [{
          id: '1',
          citations: [{
            value: 'The Title, Example (http://example.com/foo : accessed Fri May 12 2017)',
          }],
          about: 'http://example.com/foo',
          titles: [{value: 'The Title'}],
          repository: {resource: '#agent'},
        }],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Marriage({spouses: ['12', '34'], place: 'Somewhere'});
    extraction.Citation({
      title: 'The Title',
      url: 'http://example.com/foo',
      accessed: 1494603896789,
      repository_name: 'Example',
      repository_website: 'example.com',
      repository_url: 'http://example.com',
    });

    extraction.end();
  });

  it('should dedupe birth facts', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [
          {
            id: '12',
            facts: [
              {
                type: 'http://gedcomx.org/Birth',
                date: {original: 'Sometime'},
                place: {original: 'Somewhere'},
              },
            ],
          },
          {id: '34'},
          {id: '56'},
        ],
        relationships: [
          {
            type: 'http://gedcomx.org/ParentChild',
            person1: {resource: '#34'},
            person2: {resource: '#12'},
          },
          {
            type: 'http://gedcomx.org/ParentChild',
            person1: {resource: '#56'},
            person2: {resource: '#12'},
          },
        ],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Birth({person: '12', place: 'Somewhere', parents: []});
    extraction.Birth({person: '12', parents: ['34', '56']});
    extraction.Birth({person: '12', date: 'Sometime', parents: []});

    extraction.end();
  });

  it('alternate id', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          gender: {
            type: 'http://gedcomx.org/Female',
          },
        }, {
          id: 'xyz',
          gender: {
            type: 'http://gedcomx.org/Female',
          },
        }, {
          id: 'jry',
        }],
        relationships: [{
          type: 'http://gedcomx.org/ParentChild',
          person1: {
            resource: '#1234',
          },
          person2: {
            resource: '#xyz',
          },
        }, {
          type: 'http://gedcomx.org/ParentChild',
          person1: {
            resource: '#xyz',
          },
          person2: {
            resource: '#jry',
          },
        }],
      });
      done();
    })
    .catch((error) => done(error));

    extraction.Person({id: '1234'});
    extraction.AlternateId({person: '1234', id: '5678'});
    extraction.Gender({person: '5678', gender: 'Female'});

    extraction.Person({id: 'abc'});
    extraction.Birth({
      person: 'abc',
      parents: ['1234'],
    });
    extraction.AlternateId({person: 'abc', id: 'xyz', preferred: true});
    extraction.Gender({person: 'abc', gender: 'Female'});

    extraction.Birth({
      person: 'jry',
      parents: ['abc'],
    });

    extraction.end();
  });

  it('external id');

  it('don\'t create relationships array unless a rel is added', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          facts: [{
            type: 'http://gedcomx.org/Birth',
            date: {
              original: 'Sometime',
            },
          }, {
            type: 'http://gedcomx.org/Marriage', 
            date: {original: 'Sometime'},
          },
        ],
        }],
      });
      done();
    })
    .catch(done);

    extraction.Birth({person: '1234', date: 'Sometime'});
    extraction.Marriage({spouses: ['1234'], date: 'Sometime'});
    extraction.end();
  });

  it('marriage event with unknown spouse is added to the person', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          facts: [
            {type: 'http://gedcomx.org/Marriage', place: {original: 'Somewhere'}, date: {original: 'Sometime'}},
          ],
        }],
      });
      done();
    })
    .catch((error) => done(error));
    extraction.Marriage({spouses: ['1234'], place: 'Somewhere', date: 'Sometime'});
    extraction.end();
  });

  it('birth event is only added when a date or place is given', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
        }, {
          id: '567',
        }],
        relationships: [{
          type: 'http://gedcomx.org/ParentChild',
          person1: {resource: '#567'},
          person2: {resource: '#1234'},
        }],
      });
      done();
    })
    .catch((error) => done(error));
    extraction.Birth({person: '1234', parents: ['567']});
    extraction.end();
  });

  it('ids are cast to strings', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          facts: [
            {type: 'http://gedcomx.org/Birth', date: {original: 'Somewhere'}},
          ],
        }],
      });
      done();
    })
    .catch((error) => done(error));
    extraction.Person({id: 1234});
    extraction.Birth({person: 1234, date: 'Somewhere'});
    extraction.end();
  });

  it('don\'t create duplicate relationships', (done) => {
    extractionErrorListener(done);
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [
          {id: '1234'},
          {id: '90'},
          {id: '5678'},
        ],
        relationships: [{
          type: 'http://gedcomx.org/ParentChild',
          person1: {resource: '#90'},
          person2: {resource: '#1234'},
        }, {
          type: 'http://gedcomx.org/Couple',
          person1: {resource: '#1234'},
          person2: {resource: '#5678'},
          facts: [{
            type: 'http://gedcomx.org/Marriage',
            place: {original: 'Somewhere'},
          }],
        }],
      });
      done();
    })
    .catch((error) => done(error));
    extraction.Birth({person: '1234', parents: ['90']});
    extraction.Birth({person: '1234', parents: ['90']});
    extraction.Marriage({spouses: ['1234', '5678'], place: 'Somewhere'});
    extraction.Marriage({spouses: ['1234', '5678'], place: 'Somewhere'});
    extraction.end();
  });
});

function extractionErrorListener(done) {
  window.addEventListener('genxtract', (e) => {
    if(e.detail.type === 'ERROR') {
      done(new Error(e.detail.data));
    };
  });
}
