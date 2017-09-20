const tester = require('../Tester')('findmypast-person');

describe('findmypast-person', () => {

  // Authenticate with findmypast
  before(async function() {
    this.timeout(20000);
    const page = await tester.page();
    await page.goto('https://www.findmypast.com/sign-in');
    // For some reason we need to pause here; perhaps to give React a change to setup.
    // If we don't pause then our typing below might not be captured.
    await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 1000);
      });
    });
    await page.waitFor('#emailAddress');
    await page.focus('#emailAddress');
    await page.type(tester.username, {delay: 100});
    await page.focus('#password');
    await page.type(tester.password, {delay: 100});
    await page.evaluate(() => {
      document.getElementById('submit').click();
    });
    await page.waitForNavigation();
    // Test to make sure auth worked (the page changed)
    const url = await page.url();
    if(url === 'https://www.findmypast.com/sign-in') {
      throw new Error('signin failed');
    }
  });

  it('basic test', tester.test(
    'father-genxtract',
    'https://tree.findmypast.com/#/trees/cf4f2e3a-43ca-4d91-8323-b8ed85da5d51/1243559397/profile'
  ));

  after(() => {
    tester.cleanup();
  });

});
