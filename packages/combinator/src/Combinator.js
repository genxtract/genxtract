/**
 * The base class for all combinators. This handles the common handling of
 * state and processing of genxtract events.
 * 
 * Classes which extend this class must implement the dataCallback() method.
 * They may optionally implement the finalizeCallback() method.
 */
class Combinator {
  
  /**
   * @param {Object=} data
   * @param {Integer=} data.timeout Timeout, in seconds.
   */
  constructor({timeout = 10} = {}) {
    this.__timeout = timeout; // The timeout, in seconds
    this.__timeoutId = null; // The timeout id returned by setTimeout
    this.__timedoutHandler = this.__timedout.bind(this); // So we maintain "this"
    this.__processEventHandler = this.__processEvent.bind(this); // So we maintain "this" and can remove the handler
    this.__promise = {}; // .resolve and .reject are populated when start event is received
    this.__started = false; // If we have recieved the start event
    this.__ended = false; // If we have recieved the end event
    this.__completed = false; // If we have resolved or rejected
  }

  /**
   * Listen for genxtract events
   * 
   * @return {Promise} Resolves with the serialized data or rejects with an error.
   */
  start() {
    window.addEventListener('genxtract', this.__processEventHandler);
    // Return and store the promise
    return new Promise((resolve, reject) => {
      this.__promise.resolve = resolve;
      this.__promise.reject = reject;
    });
  }

  /**
   * Process data from the extractor.
   * 
   * @abstract
   * @param {Object} obj
   * @param {String} obj.type Data type
   * @param {Object} obj.data Data
   */
  dataCallback({type, data}) {
    throw new Error('Method must be implemented by subclasses.');
  }

  /**
   * Optional method that can be used for post-processing before data is serialized.
   * 
   * @abstract
   */
  finalizeCallback() {
    throw new Error('Method must be implemented by subclasses.');
  }

  /**
   * Process genxtract events
   * 
   * @param {Event} e
   * @return {void}
   */
  __processEvent(e) {
    // Do nothing if we have completed
    if (this.__completed) {
      return;
    }
    const data = e.detail;
    switch(data.type) {
      case 'START':
        // If we already started, Error
        if (this.__started) {
          return this.__complete(new Error('START called more than once'));
        }
        // If we already ended, Error
        if (this.__ended) {
          return this.__complete(new Error('START called after END'));
        }
        // Set the timeout if it's positive
        if (this.__timeout > 0) {
          // Set timeout
          this.__timeoutId = window.setTimeout(this.__timedoutHandler, this.__timeout * 1000);
        }
        // Mark us as being started
        this.__started = true;
        break;
      case 'END':
        // If we haven't started, Error
        if (!this.__started) {
          return this.__complete(new Error('END called before START'));
        }
        // If we already ended, Error
        if (this.__ended) {
          return this.__complete(new Error('END called more than once'));
        }
        // We are done at this point
        this.__ended = true;
        // If there is a finalize callback, call it
        if (this.finalizeCallback) {
          this.finalizeCallback();
        }
        // Complete without an error
        this.__complete();
        break;
      case 'DATA':
        // If we haven't started, Error
        if (!this.__started) {
          return this.__complete(new Error('DATA called before START'));
        }
        // If we already ended, Error
        if (this.__ended) {
          return this.__complete(new Error('DATA called after END'));
        }
        try {
          this.dataCallback(data.data);
        } catch (error) {
          return this.__complete(error);
        }
        break;
      case 'ERROR':
        // Do nothing on error
        break;
    }
  }

  /**
   * Called when extraction is complete. Here we cleanup, serialize,
   * and resolve the promise.
   * 
   * @param {Error=} error 
   */
  __complete(error = null) {
    // Ignore if we already completed
    if (this.__completed) {
      throw new Error('Extraction Completed more than once');
    }
    // We are completed at this point
    this.__completed = true;
    // Clear timeouts and remove event listener
    window.clearTimeout(this.__timeoutId);
    window.removeEventListener('genxtract', this.__processEventHandler);
    // If we were passed an error, reject
    if (error !== null) {
      this.__promise.reject(error);
    } else {
      // Try to serialize the data and resolve
      try {
        const data = this.serializeCallback();
        this.__promise.resolve(data);
      } catch (error) {
        this.__promise.reject(error);
      }
    }
  }

  /**
   * Fire an error if extraction complete before the timeout
   */
  __timedout() {
    // Only throw an error if the timeout fires before we're done.
    if (!this.__completed) {
      this.__complete(new Error('Timed Out'));
    }
  }
}

export default Combinator;
