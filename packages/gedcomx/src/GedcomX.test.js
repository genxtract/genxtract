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

  it('basic events');

  it('basic facts');

  it('parent events');

  it('spouse events');

  it('alternate id');
});
