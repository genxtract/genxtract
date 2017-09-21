const tester = require('../Tester')('werelate-person');

describe.only('werelate-person', () => {

  it('male', tester.test(
    'washington',
    'http://www.werelate.org/wiki/Person:George_Washington_%286%29'
  ));
  
  it('female and children', tester.test(
    'mary-ball',
    'http://www.werelate.org/wiki/Person:Mary_Ball_%285%29'
  ));

  after(() => {
    tester.cleanup();
  });

});
