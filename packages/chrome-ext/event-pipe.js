(function() {

  if (!window.genxtractListening) {
    window.addEventListener('genxtract', (event) => {
      console.log(event.detail);
    });
    window.genxtractListening = true;
    console.log('added pipe setup');
  }
  console.log('event pipe setup');
})()
