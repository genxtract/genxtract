import GedcomX from '@genxtract/gedcomx';

const events = [];

window.addEventListener('genxtract', (e) => {
  const event = e.detail;
  events.push(event);
});

const combinator = new GedcomX();

combinator.start()
  .then((data) => {
    chrome.runtime.sendMessage({events, data});
  })
  .catch((error) => console.error(error));
