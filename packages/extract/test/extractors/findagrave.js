const tester = require('../Tester')('findagrave');

// Timesout because of a 3rd party resource that never loads
describe.skip('findagrave', () => {

  it('basic test', tester.test(
    'ronald-reagan',
    'https://www.findagrave.com/cgi-bin/fg.cgi?page=gr&GRid=4244'
  ));

  after(() => {
    tester.cleanup();
  });

});
