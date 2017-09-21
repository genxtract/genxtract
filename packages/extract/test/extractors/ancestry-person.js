const tester = require('../Tester')('ancestry-person');

describe('ancestry-person', () => {

  // Authenticate with Ancestry
  before(async function() {
    this.timeout(20000);
    const page = await tester.page();
    await page.goto('https://www.ancestry.com/secure/login?returnUrl=http%3A%2F%2Fhome.ancestry.com');
    await page.evaluate((username, password) => {
      document.getElementById('username').value = username;
      document.getElementById('password').value = password;
      document.getElementById('loginButton').click();
    }, tester.username, tester.password);
    await page.waitForNavigation();
  });

  it('basic test', tester.test(
    'alonzo-foster',
    'https://www.ancestry.com/family-tree/person/tree/115498258/person/300141310390/facts'
  ));

  after(() => {
    tester.cleanup();
  });

});
