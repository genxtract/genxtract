(function() {
  if (!window.genxtractListening) {
    window.addEventListener('genxtract', (event) => {
      const obj = event.detail;
      switch(obj.type) {
        case 'START':
        case 'END':
          return console.log(`${obj.id}:${obj.type}`);
        case 'DATA':
          return console.log(`${obj.id}:${obj.type}`, obj.data);
        case 'ERROR':
          return console.error(`${obj.id}:${obj.type}`, obj.data);
      }
    });
    window.genxtractListening = true;
  }
})();
