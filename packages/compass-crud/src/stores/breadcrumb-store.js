const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

const mongodbns = require('mongodb-ns');

const BreadcrumbStore = Reflux.createStore( {
  mixins: [StateMixin.store],
  /**
   * Plugin lifecycle method that is called when the namespace changes in Compass.
   *
   * @param {string} namespace - the new namespace
   */
  onCollectionChanged(namespace) {
    const nsobj = mongodbns(namespace);
    if (nsobj.collection === '' || nsobj.ns === this.state.ns.ns) {
      return;
    }
    this.setState({
      ns: nsobj
    });
  },

  /**
   * Plugin lifecycle method that is called when the namespace changes in Compass.
   *
   * @param {string} namespace - the new namespace.
   */
  onDatabaseChanged(namespace) {
    const nsobj = mongodbns(namespace);
    if (!this.state.ns || this.state.ns.ns === nsobj.ns) {
      return;
    }
    if (nsobj.collection === '') {
      nsobj.collection = this.state.ns.collection;
    }
    this.setState({
      ns: nsobj
    });
  },

  getInitialState() {
    return {
      ns: mongodbns('')
    };
  }
});

module.exports = BreadcrumbStore;
