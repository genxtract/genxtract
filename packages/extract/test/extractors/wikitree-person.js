const tester = require('../Tester')('wikitree-person');

describe('wikitree-person', () => {

  it('basic test', tester.test(
    'Theodore Roosevelt Jr',
    'http://www.wikitree.com/wiki/Roosevelt-18'
  ));

  after(() => {
    tester.cleanup();
  });

});
