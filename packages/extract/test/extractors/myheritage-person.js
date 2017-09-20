const tester = require('../Tester')('myheritage-person');

describe('myheritage-person', () => {

  // Authenticate with findmypast
  before(async function() {
    this.timeout(20000);
    const page = await tester.page();
    await page.goto('https://www.myheritage.com/login');
    await page.evaluate((username, password) => {
      document.getElementById('email').value = username;
      document.getElementById('password').value = password;
      document.getElementById('login_button').click();
    }, tester.username, tester.password);
    await page.waitForNavigation();
  });

  it('basic test', tester.test(
    'father-genxtract',
    'https://www.myheritage.com/person-1500001_462156341_462156341/father-genxtract'
  ));

  after(() => {
    tester.cleanup();
  });

});
