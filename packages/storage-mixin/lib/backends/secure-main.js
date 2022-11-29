const { createLoggerAndTelemetry } = require('@mongodb-js/compass-logging');
const { debug, mongoLogId, log } = createLoggerAndTelemetry('COMPASS-STORAGE-MIXIN');

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

    return Promise.resolve()
      .then(function() { return require('keytar').findCredentials(meta.serviceName); })
      .catch(function(err) {
        log.error(mongoLogId(1001000175), 'keychain', 'Error calling findCredentials', { err: err.message });
        throw err;
      })
      .then(function(accounts) {
        return Promise.all(
          accounts.map(function(entry) {
            const accountName = entry.account;
            return require('keytar')
              .deletePassword(meta.serviceName, accountName)
              .then(function() {
                debug('Deleted account %s successfully', accountName);
                return accountName;
              })
              .catch(function(err) {
                log.error(mongoLogId(1001000176), 'keychain', 'Error calling deletePassword', { err: err.message });
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
    return (require('keytar')
      .deletePassword(meta.serviceName, meta.accountName))
      .then(function() {
        debug('Removed password for', {
          service: meta.serviceName,
          account: meta.accountName
        });
      })
      .catch((err) => {
        log.error(mongoLogId(1001000170), 'keychain', 'Error calling deletePassword', { err: err.message });
      });
  });

  /**
   * Update a credential.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:update', (evt, meta) => {
    return (require('keytar')
      .setPassword(meta.serviceName, meta.accountName, meta.value))
      .then(function() {
        debug('Updated password successfully for', {
          service: meta.serviceName,
          account: meta.accountName
        });
      })
      .catch(function(err) {
        log.error(mongoLogId(1001000171), 'keychain', 'Error calling setPassword', { err: err.message });
      });
  });

  /**
   * Create a credential.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:create', (evt, meta) => {
    return (require('keytar')
      .setPassword(meta.serviceName, meta.accountName, meta.value))
      .then(function() {
        debug('Successfully dreated password for', {
          service: meta.serviceName,
          account: meta.accountName
        });
      })
      .catch(function(err) {
        log.error(mongoLogId(1001000172), 'keychain', 'Error calling setPassword', { err: err.message });
      });
  });

  /**
   * Find a credential.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:find-one', (evt, meta) => {
    return (require('keytar')
      .getPassword(meta.serviceName, meta.accountName))
      .then(function(rawJsonString) {
        // TODO: why does this get broadcast rather than just returned with the
        // promise?
        ipc.broadcast('storage-mixin:find-one:result', {
          uuid: meta.uuid,
          rawJsonString: rawJsonString
        });
      })
      .catch(function(err) {
        log.error(mongoLogId(1001000173), 'keychain', 'Error calling getPassword', { err: err.message });
      });
  });

  /**
   * Find all credentials.
   *
   * @param {Event} evt - The event.
   * @param {Object} meta - The metadata.
   */
  ipc.respondTo('storage-mixin:find', (evt, meta) => {
    return (require('keytar')
      .findCredentials(meta.namespace))
      .then(function(credentials) {
        // TODO: why does this get broadcast rather than just returned with the
        // promise?
        ipc.broadcast('storage-mixin:find:result', {
          namespace: meta.namespace,
          credentials: credentials,
          callId: meta.callId
        });
      })
      .catch(function(err) {
        log.error(mongoLogId(1001000174), 'keychain', 'Error calling findCredentials', { err: err.message });
      });
  });
}
