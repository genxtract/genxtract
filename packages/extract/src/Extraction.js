class Extraction {
  constructor(id) {
    this.id = id;
    this.started = false;
    this.ended = false;
  }

  start() {
    if (this.started) {
      return this._consoleError('called start twice');
    }
    this.started = true;
    this._dispatch({
      id: this.id,
      type: 'START',
    });
  }

  data(obj) {
    if (!this.started) {
      return this._consoleError('sent data before starting', obj);
    }
    if (this.ended) {
      return this._consoleError('sent data after ending', obj);
    }
    this._dispatch({
      id: this.id,
      type: 'DATA',
      data: obj,
    });
  }

  error(error) {
    if (!this.started) {
      return this._consoleError('sent data before starting', obj);
    }
    if (this.ended) {
      return this._consoleError('sent data after ending', obj);
    }
    this._consoleError('errored:', error);
    this._dispatch({
      id: this.id,
      type: 'ERROR',
      data: (error instanceof Error) ? error.message : error,
    });
  }

  end() {
    if (this.ended) {
      return this._consoleError('called end twice');
    }
    this.ended = true;
    this._dispatch({
      id: this.id,
      type: 'END',
    });
  }

  log(...messages) {
    console.log(...messages);
  }

  _consoleError(message, obj = '') {
    console.error(new Error(`genxtract: ${this.id} ${message}`), obj);
  }

  _dispatch(obj) {
    window.dispatchEvent(new window.CustomEvent('genxtract', {detail: obj}));
  }

}

export default Extraction;
