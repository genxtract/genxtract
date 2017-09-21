const tester = require('../Tester')('billiongraves');

describe('billiongraves', () => {

  it('basic test', tester.test(
    'anna-martha-dekay',
    'https://billiongraves.com/grave/person/16626793'
  ));

  after(() => {
    tester.cleanup();
  });

});
