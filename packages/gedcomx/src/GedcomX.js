import Combinator from '@genxtract/combinator';

class GedcomX extends Combinator {
  constructor(args = {}) {
    super(args);
    // Setup model
    this._model;
  }

  dataCallback(data) {
    // update internal model
  }

  // Optional
  finalizeCallback() {
    // do final work
  }

  serializeCallback() {
    return this._model;
  }
}

export default GedcomX;
