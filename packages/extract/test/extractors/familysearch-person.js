const tester = require('../Tester')('familysearch-person');

describe('familysearch-person', () => {

  // Authenticate with FamilySearch
  before(async function() {
    this.timeout(20000);
    const page = await tester.page();
    await page.goto('https://www.familysearch.org/auth/familysearch/login?fhf=true');
    await page.evaluate((username, password) => {
      document.getElementById('userName').value = username;
      document.getElementById('password').value = password;
      document.getElementById('login').click();
    }, tester.username, tester.password);
    await page.waitForNavigation();
  });

  it('basic test', tester.test(
    'helen-g-zierak',
    'https://www.familysearch.org/tree/person/K1VK-9B3/details'
  ));

  after(() => {
    tester.cleanup();
  });

});
