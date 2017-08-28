const puppeteer = require('puppeteer');
const Extractors = require('../dist/Extractors');
const extractors = new Extractors({
  prefix: './',
});
const debug = require('debug')('genxtract:setupTest');

/**
 * Setup a mocha test.
 * 
 * @param {String} fileName Name of the file that the output will be saved to or compared to.
 * @param {Sting} url
 * @return {Function} function(done)
 */
module.exports = function setupTest(fileName, url) {
  debug(fileName, url);

  return async function() {
    this.timeout(30000);

    debug('running test', fileName);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    debug('page loaded');

    // Inject collector
    const collector = page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const events = [];
        window.addEventListener('genxtract', (e) => {
          const event = e.detail;
          events.push(event);
          if(event.type === 'END') {
            resolve(events);
          }
        });
      });
    });

    debug('collector injected');

    // Inject extractor
    const {id, path} = extractors.match({url});
    debug('extractor match', id, path);
    await page.injectFile(path);
    debug('extractor injected');

    // Wait for output
    const events = await collector;
    debug('events received');

    // Record or compare
    console.log(events);

  };

};
