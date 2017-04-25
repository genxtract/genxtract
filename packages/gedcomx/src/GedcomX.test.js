const expect = null;
const emit = null;
const combinator = null;

let extraction = null;
let promise;

describe('GedcomX', () => {
  beforeEach(() => {
    extraction = new Extraction('test');
    emit = new Emit(extraction);
    combinator = new GedcomX();
    promise = combinator.start();
    emit.start();
  });

  it('should work', (done) => {
    promise.then((data) => {
      expect(data).to.deep.equal({});
    })
    .catch((error) => done(error));

    emit.Person({id: '1234'});

    extraction.end();
  });
});
