const Model = require('ampersand-model');
const storageMixin = require('storage-mixin');
const uuid = require('uuid');
const electronApp = require('electron').remote.app;

/**
 * A model that represents a MongoDB query.
 */
const Query = Model.extend(storageMixin, {
  storage: {
    backend: 'local',
    appName: electronApp.getName()
  },
  props: {
    /**
     * The unique identifier for the query.
     */
    _id: {
      type: 'string',
      default: function() {
        return uuid.v4();
      }
    },
    /**
     * The query filter.
     */
    filter: 'string',
    /**
     * The query projection.
     */
    projection: 'string',
    /**
     * The query sort.
     */
    sort: 'string',
    /**
     * The query skip.
     */
    skip: 'number',
    /**
     * The query limit.
     */
    limit: 'number',
    /**
     * The query last executed time.
     */
    lastExecuted: 'date',
    /**
     * The query name.
     */
    name: 'string',
    /**
     * Is the query a favorite?
     */
    isFavorite: {
      type: 'boolean',
      default: false
    }
  }
});

module.exports = Query;
