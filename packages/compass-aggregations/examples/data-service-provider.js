const {
  Stitch,
  RemoteMongoClient,
  AnonymousCredential
} = require('mongodb-stitch-browser-sdk');

const debug = require('debug')('mongodb-data-service:provider-stitch');
const parseNamespaceString = require('mongodb-ns');

import { DEFAULT_STITCH_APP_ID } from './example-constants';

class StitchCursor {
  constructor(result) {
    this.result = result;
  }

  async toArray(callback) {
    const boo = await this.result.asArray();
    callback(null, boo);
  }

  // noop for stitch
  close() {}
}

class DataServiceStitchProvider {
  constructor(appId = DEFAULT_STITCH_APP_ID) {
    this._dbs = {};
    try {
      this.client = Stitch.initializeAppClient(appId);
    } catch (_err) {
      this.client = Stitch.getAppClient(appId);
    }
  }

  /**
   * @param {String} name
   * @returns {Promise}
   * @api private
   */
  db(name) {
    return this.client.auth
      .loginWithCredential(new AnonymousCredential())
      .then(() => {
        return this.client
          .getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas')
          .db(name);
      });
  }

  /**
   * @param {Array} intents - Option names which are required to express user intent.
   * @param {Object|undefined} options - Value from a plugin.
   * @returns {Object}
   * @api private
   */
  getOptionsWithIntent(intents, options) {
    options = options || {};
    const optionsWithIntent = {};
    Object.keys(options).forEach((optionName) => {
      if (intents.indexOf(optionName) === -1) {
        debug('Dropping option representitive of intent', optionName);
      } else {
        optionsWithIntent[optionName] = options[optionName];
      }
    });
    return optionsWithIntent;
  }

  /**
   * @param {string} ns `db.colectionName`
   * @param {Array} pipeline The agg pipeline
   * @param {Object} options Any driver options a plugin might request (@see getOptionsWithIntent)
   * @param {Function} callback
   */
  aggregate(ns, pipeline, options, callback) {
    options = this.getOptionsWithIntent(['collation'], options);

    const { database, collection } = parseNamespaceString(ns);

    this.db(database)
      .then((_db) => _db.collection(collection).aggregate(pipeline))
      .then((res) => callback(null, new StitchCursor(res)))
      .catch((err) => callback(err));
  }

  /**
   * @param {string} ns `db.colectionName`
   * @param {Object} predicate A query predicate
   * @param {Object} options Any driver options a plugin might request (@see getOptionsWithIntent)
   * @param {Function} callback
   */
  async count(ns, predicate, options, callback) {
    const { database, collection } = parseNamespaceString(ns);

    /**
     * @note lucas: Just to capture that compass-aggregations does not send
     * any options expressing user intent.
     */
    options = this.getOptionsWithIntent([], options);

    /**
     * @note lucas: compass-aggregations will always send `{}` as it is not user
     * configurable. Other plugins do send a predicate but an edge case we can
     * discuss and work out on plugin by plugin basis.
     */
    this.db(database)
      .then((_db) => _db.collection(collection).count(predicate))
      .then((res) => callback(null, res))
      .catch((err) => callback(err));
  }
}

export default DataServiceStitchProvider;
