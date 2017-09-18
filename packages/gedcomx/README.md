# GEDCOM X

A combinator for GEDCOM X

`npm install @genxtract/gedcomx`

## Usage

```javascript
// First we setup the combinator

import GedcomX from '@genxtract/gedcomx';

const combinator = new GedcomX({timeout = 5});

combinator.start()
  then((data) => {
    // Do something
  })
  .catch((error) => {
    console.log(error);
  });

window.addEventListener('genxtract', (e) => {
  const data = e.detail;
  if (data.type === 'ERROR') {
    // Do something with errors?
  }
})

...

// In another script that executes after the combinator was setup
// we then inject the extractor.
import extractor from '@genxtract/extract/dist/werelate-person.js';
```
