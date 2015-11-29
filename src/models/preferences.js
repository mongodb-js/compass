var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');

var Preferences = Model.extend(storageMixin, {
  idAttribute: 'id',
  namespace: 'Preferences',
  storage: 'local',
  props: {
    id: {
      type: 'string',
      default: 'General',
      required: true
    },
    /**
     * Stores the last version compass was run as.
     * @type {String}
     */
    lastKnownVersion: {
      type: 'string',
      required: false
    },
    /**
     * Stores a unique anonymous user ID for the current user
     * @type {String}
     */
    currentUserId: {
      type: 'string',
      required: true,
      default: ''
    },
    disableGoogleMaps: {
      type: 'boolean',
      required: true,
      default: false
    }
  }
});

module.exports = Preferences;
