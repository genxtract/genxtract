const setupTest = require('../tester')('wikitree-person');

describe('wikitree-person', () => {

  it('basic male', setupTest(
    'Theodore Roosevelt Jr',
    'http://www.wikitree.com/wiki/Roosevelt-18'
  ));

});
