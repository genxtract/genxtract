const {events, data} = chrome.extension.getBackgroundPage().getData();
const eventSection = document.getElementById('events');
const dataSection = document.getElementById('data');


for (const event of events) {
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(event, null, 2);
  pre.classList.add('event');
  eventSection.appendChild(pre);
}

const dataElem = document.createElement('pre');
dataElem.textContent = JSON.stringify(data, null, 2);
dataElem.classList.add('data');
dataSection.appendChild(dataElem);
