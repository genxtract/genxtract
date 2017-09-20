const tester = require('../Tester')('findmypast-person');

describe('findmypast-person', () => {

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
    'https://tree.findmypast.com/#/trees/cf4f2e3a-43ca-4d91-8323-b8ed85da5d51/1243559397/profile'
  ));

  after(() => {
    tester.cleanup();
  });

});
