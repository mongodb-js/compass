const app = require('ampersand-app');
const React = require('react');
const SchemaStore = require('../store');
const StateMixin = require('reflux-state-mixin');
const Field = require('./field');
const StatusSubview = require('../component/status-subview');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:schema');

/**
 * Component for the entire schema view component.
 */
const Schema = React.createClass({

  mixins: [
    StateMixin.connect(SchemaStore)
  ],

  componentWillMount() {
    this.samplingMessage = app.appRegistry.getComponent('Query.SamplingMessage');
    this.StatusAction = app.appRegistry.getAction('Status.Actions');
  },

  shouldComponentUpdate() {
    return true;
  },

  /**
   * updates the progress bar according to progress of schema sampling.
   * The count is indeterminate (trickling), and sampling/analyzing is
   * increased in 5% steps.
   */
  _updateProgressBar() {
    if (this.state.samplingState === 'error') {
      this.StatusAction.configure({
        progressbar: false,
        animation: false
      });
      return;
    }
    const progress = this.state.samplingProgress;
    // initial schema phase, cannot measure progress, enable trickling
    if (this.state.samplingProgress === -1) {
      this.trickleStop = null;
      this.StatusAction.configure({
        visible: true,
        progressbar: true,
        progress: 0,
        animation: true,
        trickle: true,
        subview: StatusSubview
      });
    } else if (progress >= 0 && progress < 100 && progress % 5 === 1) {
      if (this.trickleStop === null) {
        // remember where trickling stopped to calculate remaining progress
        const StatusStore = app.appRegistry.getStore('Status.Store');
        this.trickleStop = StatusStore.state.progress;
      }
      const newProgress = Math.ceil(this.trickleStop + (100 - this.trickleStop) / 100 * progress);
      this.StatusAction.configure({
        visible: true,
        trickle: false,
        animation: true,
        progressbar: true,
        subview: StatusSubview,
        progress: newProgress
      });
    } else if (progress === 100) {
      this.StatusAction.done();
    }
  },

  /**
   * Render the schema
   *
   * @returns {React.Component} The schema view.
   */
  render() {
    this._updateProgressBar();
    const fieldList = _.get(this.state.schema, 'fields', []).map((field) => {
      return <Field key={field.name} {...field} />;
    });
    return (
      <div>
        <this.samplingMessage sampleSize={this.state.schema ? this.state.schema.count : 0}/>
        <div className="column-container with-refinebar-and-message">
          <div className="column main">
            <div className="schema-field-list">
              {fieldList}
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Schema;
