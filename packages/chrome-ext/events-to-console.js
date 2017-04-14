(function() {

  if (!window.genxtractListening) {
    window.addEventListener('genxtract', (event) => {
      console.log(event.detail);
    });
    window.genxtractListening = true;
  }
})()
