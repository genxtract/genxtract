import Emit from '@genxtract/extract/src/Emit.js';
import Extraction from '@genxtract/extract/src/Extraction.js';
import GedcomX from './GedcomX.js';

let extraction;
let emit;
let promise;

describe('GedcomX', () => {
  beforeEach(() => {
    extraction = new Extraction('test');
    emit = new Emit(extraction);
    const combinator = new GedcomX();
    promise = combinator.start();
    extraction.start();
  });

  it('basic person', (done) => {
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
        }],
      });
      done();
    })
    .catch((error) => done(error));

    emit.Person({id: '1234'});

    extraction.end();
  });

  it('primary person', (done) => {
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

    emit.Person({id: '1234', primary: true});

    extraction.end();
  });

  it('gender', (done) => {
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

    emit.Gender({person: '1234', gender: 'Male'});

    extraction.end();
  });

  it('name', (done) => {
    promise.then((data) => {
      expect(data).to.deep.equal({
        persons: [{
          id: '1234',
          names: [{
            nameForms: [{
              fullText: 'John',
              parts: [
                {type: 'http://gedcomx.org/Given', value: 'John'},
              ],
            }],
          }],
        },
        {
          id: '5678',
          names: [{
            nameForms: [{
              fullText: 'John C Smith',
              parts: [
                {type: 'http://gedcomx.org/Given', value: 'John C'},
                {type: 'http://gedcomx.org/Surname', value: 'Smith'},
              ],
            }],
          }],
        }],
      });
      done();
    })
    .catch((error) => done(error));

    emit.Name({person: '1234', name: 'John'});
    emit.Name({person: '5678', name: 'John  C    Smith'});

    extraction.end();
  });

  it('basic events/facts', (done) => {
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

    emit.Baptism({person: '1234', place: 'Somewhere'});
    emit.Death({person: '1234', date: 'Sometime'});
    emit.Citizenship({person: '1234', value: 'Somewhere'});

    extraction.end();
  });

  it('parent events');

  it('spouse events');

  it('alternate id');
});
