import Extraction from '../lib/Extraction.js';

const extraction = new Extraction('test');

extraction.start();

extraction.data({foo: 'bar'});

extraction.error('An error string');

extraction.error(new Error('an error object'));

extraction.data({baz: true});

extraction.end();
