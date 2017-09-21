const tester = require('../Tester')('ancestry-record');

describe('ancestry-record', () => {

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
    'http://search.ancestry.com/cgi-bin/sse.dll?indiv=1&db=1940usfedcen&h=34642399'
  ));

  after(() => {
    tester.cleanup();
  });

});
