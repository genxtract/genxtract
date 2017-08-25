class Extraction {
  
  /**
   * @param {String} id ID of the extraction. Used to differentiate multiple extractions on the same page.
   */
  constructor(id) {
    this.id = id;
    this.started = false;
    this.ended = false;
  }

  /**
   * Signal the start of the extraction.
   */
  start() {
    if (this.started) {
      this._consoleError('called start twice');
      return;
    }
    this.started = true;
    this._dispatch({
      id: this.id,
      type: 'START',
    });
  }

  /**
   * Dispatch data
   * 
   * @param {Object} data
   */
  data(data) {
    if (!this.started) {
      this._consoleError('sent data before starting', data);
      return;
    }
    if (this.ended) {
      this._consoleError('sent data after ending', data);
      return;
    }
    this._dispatch({
      id: this.id,
      type: 'DATA',
      data: data,
    });
  }

  /**
   * Dispatch an error
   * 
   * @param {Error|String} error 
   */
  error(error) {
    if (!this.started) {
      this._consoleError('sent data before starting', error);
      return;
    }
    if (this.ended) {
      this._consoleError('sent data after ending', error);
      return;
    }
    this._consoleError('errored:', error);
    this._dispatch({
      id: this.id,
      type: 'ERROR',
      data: (error instanceof Error) ? error.message : error,
    });
  }

  /**
   * Signal the end of extraction.
   */
  end() {
    // TODO: throw error if extraction hasn't started?
    if (this.ended) {
      this._consoleError('called end twice');
      return;
    }
    this.ended = true;
    this._dispatch({
      id: this.id,
      type: 'END',
    });
  }

  /**
   * DEPRECATED. REMOVE.
   */
  _consoleError(message, obj = '') {
    console.error(new Error(`genxtract: ${this.id} ${message}`), obj);
  }

  /**
   * Dispatch data as a custom `genxtract` event
   * 
   * @param {*} obj 
   */
  _dispatch(obj) {
    window.dispatchEvent(new window.CustomEvent('genxtract', {detail: obj}));
  }

}

export default Extraction;
