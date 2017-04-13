class Genxtract {
  constructor() {

  }

  match({url}) {
    return [
      {id: 'inject', path: 'node_modules/@genxtract/extract/inject.js'},
    ];
  }
}

export default Genxtract;
