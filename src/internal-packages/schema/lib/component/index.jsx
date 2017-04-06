const app = require('hadron-app');
const React = require('react');
const ReactTooltip = require('react-tooltip');
const { StatusRow } = require('hadron-react-components');
const SchemaActions = require('../action');
const SchemaStore = require('../store');
const StateMixin = require('reflux-state-mixin');
const Field = require('./field');
const StatusSubview = require('../component/status-subview');
const { TOOLTIP_IDS } = require('../constants');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:schema');

const QUERYBAR_LAYOUT = ['filter', ['project', 'limit']];

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
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.HadronTooltip = app.appRegistry.getComponent('App.HadronTooltip');
  },

  componentDidUpdate() {
    // when the namespace changes and the schema tab is not active, the
    // tab is "display:none" and its width 0. That also means the the minichart
    // auto-sizes to 0. Therefore, when the user switches back to the tab,
    // making it "display:block" again and giving it a proper non-zero size,
    // the minicharts have to be re-rendered.
    if (this.CollectionStore.getActiveTab() === 0) {
      SchemaActions.resizeMiniCharts();
      ReactTooltip.rebuild();
    }
  },

  /**
   * updates the progress bar according to progress of schema sampling.
   * The count is indeterminate (trickling), and sampling/analyzing is
   * increased in 5% steps.
   */
  _updateProgressBar() {
    if (this.state.samplingState === 'timeout') {
      this.StatusAction.configure({
        progressbar: false,
        animation: false,
        trickle: false
      });
      return;
    }
    if (this.state.samplingState === 'error') {
      this.StatusAction.hide();
    }
    const progress = this.state.samplingProgress;
    // initial schema phase, cannot measure progress, enable trickling
    if (this.state.samplingProgress === -1) {
      this.trickleStop = null;
      this.StatusAction.configure({
        visible: true,
        progressbar: true,
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

  renderErrorMessage() {
    if (this.state.samplingState === 'error') {
      return (
        <StatusRow style="error">
          An error occured during schema analysis: {this.state.errorMessage}
        </StatusRow>
      );
    }
    return null;
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
      <div className="content-container content-container-schema schema-container">
        <div className="controls-container">
          <this.queryBar layout={QUERYBAR_LAYOUT} />
          <this.samplingMessage sampleSize={this.state.schema ? this.state.schema.count : 0}/>
          {this.renderErrorMessage()}
        </div>
        <div className="column-container">
          <div className="column main">
            <div className="schema-field-list">
              {fieldList}
            </div>
          </div>
        </div>
        <this.HadronTooltip
          id={TOOLTIP_IDS.SCHEMA_PROBABILITY_PERCENT}
          className="opaque-tooltip"
        />
      </div>
    );
  }
});

module.exports = Schema;
