const React = require('react');
const MetricsStore = require('../store');
const MetricsAction = require('../action');
const StateMixin = require('reflux-state-mixin');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

// const debug = require('debug')('mongodb-compass:metrics-component');


const MetricsComponent = React.createClass({

  /**
   * automatically subscribe/unsubscribe to changes from these stores.
   */
  mixins: [
    StateMixin.connect(MetricsStore)
  ],

  getInitialState() {
    return {
      ns: NamespaceStore.ns
    };
  },

  /**
   * Fetch metrics on initial render.
   */
  componentWillMount() {
    MetricsAction.fetchMetrics();
  },

  /**
   * Subscribe manually to the namespace store on mount, because that store
   * doesn't support automatic subscription yet.
   */
  componentDidMount() {
    this.unsubscribeNS = NamespaceStore.listen(this.handleNamespaceChange);
  },

  /**
   * Unsubscribe from the namespace store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeNS();
  },

  /**
   * handle changes in the namespace and fetch new metrics.
   *
   * @param {String} ns    namespace of the selected collection.
   */
  handleNamespaceChange(ns) {
    this.setState({
      ns: ns
    });
    MetricsAction.fetchMetrics();
  },

  /**
   * Render Metrics.
   *
   * @returns {React.Component} The Metrics view.
   */
  render() {
    const namespace = this.state.ns;
    const status = this.state.status;
    const documents = JSON.stringify(this.state.documents);

    return (
      <div id="metrics-container">
        <h1>Hello Brahm and Chris.</h1>
        <p>Here is some space for you to visualize your metrics.</p>
        <p>You are currently looking at the {namespace} collection.</p>
        <p>The current component state is: <code>{status}</code></p>
        <p>The metrics documents are</p>
        <pre>
          {documents}
        </pre>
      </div>
    );
  }
});


module.exports = MetricsComponent;
