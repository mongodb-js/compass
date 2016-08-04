const React = require('react');
const MetricsStore = require('../store');
const StateMixin = require('reflux-state-mixin');

const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

const debug = require('debug')('mongodb-compass:metrics');


const MetricsComponent = React.createClass({

  /**
   * automatically subscribe/unsubscribe to changes from these stores.
   */
  mixins: [
    StateMixin.connect(MetricsStore)
  ],

  /**
   * Subscribe manually to the namespace store on mount, because that store
   * doesn't support automatic subscription yet.
   */
  componentDidMount() {
    this.unsubscribeNS = NamespaceStore.listen(this.handleNamespaceChange.bind(this));
  },

  /**
   * Unsubscribe from the namespace store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeNS();
  },

  /**
   * handle changes in the namespace, e.g. hide if the collection name
   * is no longer supported for this view.
   *
   * @param {String} ns    namespace of the selected collection.
   */
  handleNamespaceChange(ns) {
    debug('ns changed to', ns);
  },

  /**
   * Render Metrics.
   *
   * @returns {React.Component} The Metrics view.
   */
  render() {
    return (
      <div>
        <h1>I'm a Metrics component.</h1>
        <p>Visualize Compass metrics in Compass.</p>
      </div>
    );
  }
});


module.exports = MetricsComponent;
