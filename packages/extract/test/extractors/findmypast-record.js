const tester = require('../Tester')('findmypast-record');

describe('findmypast-record', () => {

  // Authenticate with findmypast
  before(async function() {
    this.timeout(20000);
    const page = await tester.page();
    await page.goto('https://www.findmypast.com/sign-in');
    await page.evaluate((username, password) => {
      document.getElementById('emailAddress').value = username;
      document.getElementById('password').value = password;
      document.getElementById('submit').click();
    }, tester.username, tester.password);
    await page.waitForNavigation();
  });

  it('basic test', tester.test(
    'alonzo-foster',
    'https://search.findmypast.com/record?id=usc%2f1840%2f005154562%2f01062%2f026'
  ));

  after(() => {
    tester.cleanup();
  });

});
