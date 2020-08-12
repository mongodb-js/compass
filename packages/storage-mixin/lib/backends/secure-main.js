const keytar = require('keytar');
const debug = require('debug')('mongodb-storage-mixin:backends:secure-main');

if (process && process.type === 'browser') {
  const ipc = require('hadron-ipc');

  /**
   * Clear the entire namespace. Use with caution!
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:clear', (evt, meta) => {
    debug('Clearing all secure values for', meta.serviceName);

    let promise;
    try {
      promise = keytar.findCredentials(meta.serviceName);
    } catch (e) {
      debug('Error calling findCredentials', e);
      throw e;
    }

    promise.then(function(accounts) {
      return Promise.all(
        accounts.map(function(entry) {
          const accountName = entry.account;
          return keytar
            .deletePassword(meta.serviceName, accountName)
            .then(function() {
              debug('Deleted account %s successfully', accountName);
              return accountName;
            })
            .catch(function(err) {
              debug('Failed to delete', accountName, err);
              throw err;
            });
        })
      );
    })
      .then(function(accountNames) {
        debug(
          'Cleared %d accounts for serviceName %s',
          accountNames.length,
          meta.serviceName,
          accountNames
        );
      })
      .catch(function(err) {
        debug('Failed to clear credentials!', err);
      });
  });

  /**
   * Remove a credential.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:remove', (evt, meta) => {
    keytar
      .deletePassword(meta.serviceName, meta.accountName)
      .then(function() {
        debug('Removed password for', {
          service: meta.serviceName,
          account: meta.accountName
        });
      })
      .catch((err) => {
        debug('Error removing password', err);
      });
  });

  /**
   * Update a credential.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:update', (evt, meta) => {
    keytar
      .setPassword(meta.serviceName, meta.accountName, meta.value)
      .then(function() {
        debug('Updated password successfully for', {
          service: meta.serviceName,
          account: meta.accountName
        });
      })
      .catch(function(err) {
        debug('Error updating password', err);
      });
  });

  /**
   * Create a credential.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:create', (evt, meta) => {
    keytar
      .setPassword(meta.serviceName, meta.accountName, meta.value)
      .then(function() {
        debug('Successfully dreated password for', {
          service: meta.serviceName,
          account: meta.accountName
        });
      })
      .catch(function(err) {
        debug('Error creating password', err);
      });
  });

  /**
   * Find a credential.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:find-one', (evt, meta) => {
    keytar
      .getPassword(meta.serviceName, meta.accountName)
      .then(function(rawJsonString) {
        ipc.broadcast('storage-mixin:find-one:result', {
          uuid: meta.uuid,
          rawJsonString: rawJsonString
        });
      })
      .catch(function(err) {
        debug('Error finding one', err);
      });
  });

  /**
   * Find all credentials.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:find', (evt, meta) => {
    keytar
      .findCredentials(meta.namespace)
      .then(function(credentials) {
        ipc.broadcast('storage-mixin:find:result', {
          namespace: meta.namespace,
          credentials: credentials,
          callId: meta.callId
        });
      })
      .catch(function(err) {
        debug('Error finding', err);
      });
  });
}
