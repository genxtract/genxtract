const tester = require('../Tester')('myheritage-record');

// No free records available for testing at MyHeritage
describe.skip('myheritage-record', () => {

  after(() => {
    tester.cleanup();
  });

});
