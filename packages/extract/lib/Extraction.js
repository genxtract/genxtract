class Extraction {
  constructor(id) {
    this.id = id;
    this.started = false;
    this.ended = false;
  }

  start() {
    if (this.started) {
      return this.log('called start twice');
    }
    this.started = true;
    this._dispatch({
      id: this.id,
      type: 'START'
    });
  }

  data(obj) {
    if (!this.started) {
      return this.log('sent data before starting', obj);
    }
    if (this.ended) {
      return this.log('sent data after ending', obj);
    }
    this._dispatch({
      id: this.id,
      type: 'DATA',
      data: obj,
    });
  }

  error(error) {
    if (!this.started) {
      return this.log('sent data before starting', obj);
    }
    if (this.ended) {
      return this.log('sent data after ending', obj);
    }
    this.log('errored', error);
    this._dispatch({
      id: this.id,
      type: 'ERROR',
      data: (error instanceof Error) ? error.message : error,
    });
  }

  end() {
    if (this.ended) {
      return this.log('called end twice');
    }
    this.ended = true;
    this._dispatch({
      id: this.id,
      type: 'END'
    });
  }

  log(message, obj = '') {
    console.error(new Error(`genxtract: ${this.id} ${message}`), obj);
  }

  _dispatch(obj) {
    window.dispatchEvent(new CustomEvent('genxtract', {detail: obj}));
  }

}

export default Extraction;
