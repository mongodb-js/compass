const inherits = require('util').inherits;
const BaseBackend = require('./base');
const _ = require('lodash');
const debug = require('debug')('mongodb-storage-mixin:backends:secure-ipc');
const uuidv4 = require('uuid/v4');

function SecureIpcBackend(options) {
  if (!(this instanceof SecureIpcBackend)) {
    return new SecureIpcBackend(options);
  }

  options = _.defaults(options, {
    appName: 'storage-mixin'
  });

  this.namespace = options.appName + '/' + options.namespace;
}
inherits(SecureIpcBackend, BaseBackend);

if (typeof window !== 'undefined') {
  const ipc = require('hadron-ipc');

  /**
   * Clear the entire namespace. Use with caution!
   *
   * @param {String} namespace
   * @param {Function} done
   */
  SecureIpcBackend.clear = function(namespace, done) {
    const serviceName = `storage-mixin/${namespace}`;
    debug('Clearing all secure values for', serviceName);
    ipc.call('storage-mixin:clear', { serviceName: serviceName })
      .then(done)
      .catch(done);
  };

  /**
   * Remove the passwords properties for a model from the OS keychain.
   *
   * @param {ampersand-model} model
   * @param {Object} options
   * @param {Function} done
   *
   * @see http://ampersandjs.com/docs#ampersand-model-destroy
   */
  SecureIpcBackend.prototype.remove = function(model, options, done) {
    const accountName = this._getId(model);
    const serviceName = this.namespace;
    ipc.call('storage-mixin:remove', { accountName: accountName, serviceName: serviceName })
      .then(done)
      .catch(done);
  };

  /**
   * Update the passwords properties for a model in the OS keychain.
   *
   * @param {ampersand-model} model
   * @param {Object} options
   * @param {Function} done
   *
   * @see http://ampersandjs.com/docs#ampersand-model-save
   */
  SecureIpcBackend.prototype.update = function(model, options, done) {
    const serviceName = this.namespace;
    const accountName = this._getId(model);
    const value = JSON.stringify(this.serialize(model));
    ipc.call('storage-mixin:update', {
      accountName: accountName,
      serviceName: serviceName,
      value: value
    })
      .then(done)
      .catch(done);
  };

  /**
   * Add the passwords properties for a model in the OS keychain.
   *
   * @param {ampersand-model} model
   * @param {Object} options
   * @param {Function} done
   *
   * @see http://ampersandjs.com/docs#ampersand-model-save
   */
  SecureIpcBackend.prototype.create = function(model, options, done) {
    const serviceName = this.namespace;
    const accountName = this._getId(model);
    const value = JSON.stringify(this.serialize(model));
    ipc.call('storage-mixin:create', {
      accountName: accountName,
      serviceName: serviceName,
      value: value
    })
      .then(done)
      .catch(done);
  };

  /**
   * Load the passwords properties for a model from the OS keychain.
   *
   * @param {ampersand-model} model
   * @param {Object} options
   * @param {Function} done
   *
   * @see http://ampersandjs.com/docs#ampersand-model-fetch
   */
  SecureIpcBackend.prototype.findOne = function(model, options, done) {
    const serviceName = this.namespace;
    const accountName = this._getId(model);
    const uuid = uuidv4();

    const listener = (evt, result) => {
      if (result.uuid === uuid) {
        if (!result.rawJsonString) {
          done(null, {});
        } else {
          done(null, JSON.parse(result.rawJsonString));
        }
      }
    };

    ipc.on('storage-mixin:find-one:result', listener);

    // TODO: this returns a promise, but for some reason the result gets
    // broadcast rather than just returned with the promise?
    ipc.call('storage-mixin:find-one', {
      accountName: accountName,
      serviceName: serviceName,
      uuid: uuid
    });
  };

  /**
   * Fetch all keys stored under the active namespace.
   *
   * Note: keytar does not have the ability to return all keys for a given
   * namespace (service). Thus this only works if the collection is
   * pre-populated with stub models that hold their ids already.
   *
   * For merging secure data correctly in the splice backend, we also return
   * the id value again for each object even though that information is not
   * stored as part of the secure data.
   *
   * @param {ampersand-collection} collection
   * @param {Object} options
   * @param {Function} done
   *
   * @see http://ampersandjs.com/docs#ampersand-collection-fetch
   */
  SecureIpcBackend.prototype.find = function(collection, options, done) {
    debug('Fetching data...', collection.length);

    const handleResponse = (result) => {
      if (result.namespace === this.namespace) {
        const attributes = collection.reduce((attrs, model) => {
          const modelId = model.getId();
          const credential = result.credentials.find((iteratee) => {
            return iteratee.account === modelId;
          });
          const attr = {};
          attr[model.idAttribute] = modelId;
          if (credential) {
            const password = JSON.parse(credential.password);
            _.assign(attr, password);
          }
          attrs.push(attr);
          return attrs;
        }, []);

        done(null, attributes);
      }
    };

    const callId = uuidv4();

    const listener = (evt, result) => {
      try {
        if (result.callId && result.callId !== callId) {
          // do not handle responses from other `.find` calls
          debug(
            'Skip response from another storage-mixin:find call',
            {
              expectedCallId: callId,
              receivedCallId: result.callId
            }
          );

          return;
        }

        debug('Processing results of storage-mixin:find', { callId: result.callId });

        // make sure we process the same response once and we
        // avoid zombie listeners
        ipc.removeListener('storage-mixin:find:result', listener);

        handleResponse(result);
      } catch (err) {
        debug('Error processing the results of storage-mixin:find', err);
      }
    };

    ipc.on('storage-mixin:find:result', listener);

    // TODO: this returns a promise, but for some reason the result gets
    // broadcast rather than just returned with the promise?
    ipc.call('storage-mixin:find', {
      callId: callId,
      namespace: this.namespace
    });
  };
}

module.exports = SecureIpcBackend;
