const tester = require('../Tester')('genealogieonline');

describe('genealogieonline', () => {

  it('simple', tester.test(
    'simple',
    'https://www.genealogieonline.nl/en/voorouders-monique-en-jan-vis/I15210.php'
  ));
  
  it('child', tester.test(
    'child',
    'https://www.genealogieonline.nl/en/voorouders-monique-en-jan-vis/I39364.php'
  ));
  
  it('children', tester.test(
    'children',
    'https://www.genealogieonline.nl/en/voorouders-monique-en-jan-vis/I39356.php'
  ));
  
  // There is no schema.org markup for grandparents. This is mostly to make sure
  // it doesn't intefere with parsing
  it('grandparents', tester.test(
    'grandparents',
    'https://www.genealogieonline.nl/en/voorouders-monique-en-jan-vis/I39388.php'
  ));

  after(() => {
    tester.cleanup();
  });

});
