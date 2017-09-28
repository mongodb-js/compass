const Reflux = require('reflux');

const mongodbns = require('mongodb-ns');

const Actions = require('../actions');

const BreadcrumbStore = Reflux.createStore( {
  /**
   * The BreadcrumbStore keeps track of the path of the table view, which is the
   * combination of field names and array indexes that we have "drilled down"
   * into. `this.path` is an array containing the segments of the path in order,
   * `this.types` is an array of the types of each segment of the path.
   *
   * The Store will trigger with the collection name, the list of path segments,
   * and the list of segment types.
   */
  init() {
    this.path = [];
    this.types = [];
    this.collection = '';

    this.listenTo(Actions.pathChanged, this.pathChanged.bind(this));
  },

  /**
   * Plugin lifecycle method that is called when the namespace changes in
   * Compass. Trigger with new namespace and cleared path/types.
   *
   * @param {string} namespace - the new namespace
   */
  onCollectionChanged(namespace) {
    const nsobj = mongodbns(namespace);
    this.trigger({collection: nsobj.collection, path: [], types: []});
  },

  /**
   * The path of the table view has changed.
   *
   * @param {String} path - A combination of fieldnames and indexes.
   */
  pathChanged(path, types) {
    this.path = path;
    this.types = types;
    this.trigger({path: this.path, types: this.types});
  }

});

module.exports = BreadcrumbStore;
