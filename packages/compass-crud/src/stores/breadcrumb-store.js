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
    this.doc = null;

    this.listenTo(Actions.pathChanged, this.pathChanged.bind(this));
    this.listenTo(Actions.drillDown, this.drillDown.bind(this));
  },

  /**
   * Add the hooks into the app registry.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    appRegistry.on('collection-changed', this.onCollectionChanged.bind(this));
  },

  /**
   * Plugin lifecycle method that is called when the namespace changes in
   * Compass. Trigger with new namespace and cleared path/types.
   *
   * @param {string} namespace - the new namespace
   */
  onCollectionChanged(namespace) {
    const nsobj = mongodbns(namespace);
    this.trigger({collection: nsobj.collection, path: [], types: [], document: this.doc});
  },

  /**
   * The path of the table view has changed.
   *
   * @param {Array} path - A list of fieldnames and indexes.
   * @param {Array} types - A list of the types of each path segment.
   */
  pathChanged(path, types) {
    this.path = path;
    this.types = types;
    this.trigger({path: this.path, types: this.types, document: this.doc});
  },

  /**
   * The user has drilled down into a new element.
   *
   * @param {HadronDocument} document - The parent document.
   * @param {Element} element - The element being drilled into.
   * @param {Object} editParams - If we need to open a cell for editing, the coordinates.
   */
  drillDown(document, element, editParams) {
    this.path.push(element.currentKey);
    this.types.push(element.currentType);
    this.doc = document;
    this.trigger({
      path: this.path, types: this.types, document: this.doc,
      editParams: editParams});
  }
});

module.exports = BreadcrumbStore;
