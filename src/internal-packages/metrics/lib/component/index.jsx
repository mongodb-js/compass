const React = require('react');
const MetricsStore = require('../store');
const MetricsAction = require('../action');
const StateMixin = require('reflux-state-mixin');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const D3Component = require('./d3component');
const rectangleFn = require('../d3/rectangle');

const debug = require('debug')('mongodb-compass:metrics-component');


const MetricsComponent = React.createClass({

  /**
   * automatically subscribe/unsubscribe to changes from the metrics store.
   */
  mixins: [
    StateMixin.connect(MetricsStore)
  ],

  /**
   * define initial state (in addition to what the stores add)
   * @return {Object}  initial state of the component
   */
  getInitialState() {
    return {
      ns: NamespaceStore.ns,
      data: []
    };
  },

  /**
   * Fetch metrics on initial render.
   */
  componentWillMount() {
    MetricsAction.fetchMetrics();
    this.timer = setInterval(() => {
      const numEl = Math.floor(Math.random() * 10);
      const newData = [];

      for (let i = 0; i < numEl; i++) {
        newData.push(Math.random() * 50);
      }
      this.setState({
        data: newData
      });
    }, 1000);
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
    clearInterval(this.timer);
  },

  componentWillUpdate() {
    debug('state', this.state.data);
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
   * Render Metrics Component
   *
   * @returns {React.Component} The Metrics view.
   */
  render() {
    const namespace = this.state.ns;
    const status = this.state.status;
    const documents = JSON.stringify(this.state.documents);

    const width = 400;
    const height = 300;

    return (
      <div id="metrics-container">
        <h1>Hello Brahm and Chris.</h1>
        <p>Here is some space for you to visualize your metrics.</p>
        <p>You are currently looking at the {namespace} collection.</p>
        <p>The current component state is: <code>{status}</code></p>

        <D3Component
          data={this.state.data}
          renderMode="svg"
          width={width}
          height={height}
          d3fn={rectangleFn}
        />
      </div>
    );
  }
});


module.exports = MetricsComponent;
