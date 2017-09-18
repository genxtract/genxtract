const tester = require('../Tester')('familysearch-record');

describe('familysearch-record', () => {

  it('basic test', tester.test(
    'frank-van-sky',
    'https://www.familysearch.org/pal:/MM9.1.1/MZ87-RG9'
  ));

  after(() => {
    tester.cleanup();
  });

});
