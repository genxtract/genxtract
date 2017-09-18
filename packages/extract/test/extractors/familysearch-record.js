const setupTest = require('../tester')('familysearch-record');

describe('familysearch-record', () => {

  it('basic test', setupTest(
    'frank-van-sky',
    'https://www.familysearch.org/pal:/MM9.1.1/MZ87-RG9'
  ));

});
