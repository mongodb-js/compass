const app = require('ampersand-app');
const React = require('react');
const SchemaActions = require('../action');
const Field = require('./field');
const StatusSubview = require('../component/status-subview');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:schema');


const INITIAL_WARNING = 'Please click "Sample" to start schema analysis for the current query.';

const OUTDATED_WARNING = 'The schema content is outdated and no longer in sync'
  + ' with the entered query. Press "Sample" again to see the schema for the'
  + ' current query.';

/**
 * Component for the entire schema view component.
 */
class Schema extends React.Component {

  componentWillMount() {
    this.statusRow = app.appRegistry.getComponent('App.StatusRow');
    this.samplingMessage = app.appRegistry.getComponent('Query.SamplingMessage');
    this.StatusAction = app.appRegistry.getAction('Status.Actions');
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidUpdate() {
    // when the namespace changes and the schema tab is not active, the
    // tab is "display:none" and its width 0. That also means the the minichart
    // auto-sizes to 0. Therefore, when the user switches back to the tab,
    // making it "display:block" again and giving it a proper non-zero size,
    // the minicharts have to be re-rendered.
    SchemaActions.resizeMiniCharts();
  }

  onApplyClicked() {
    SchemaActions.startSampling();
  }

  onResetClicked() {
    SchemaActions.startSampling();
  }

  /**
   * updates the progress bar according to progress of schema sampling.
   * The count is indeterminate (trickling), and sampling/analyzing is
   * increased in 5% steps.
   */
  _updateProgressBar() {
    if (this.props.samplingState === 'error') {
      this.StatusAction.configure({
        progressbar: false,
        animation: false
      });
      return;
    }
    const progress = this.props.samplingProgress;
    // initial schema phase, cannot measure progress, enable trickling
    if (this.props.samplingProgress === -1) {
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
  }

  renderBanner() {
    let banner;
    if (this.props.samplingState === 'initial') {
      banner = <this.statusRow style="warning">{INITIAL_WARNING}</this.statusRow>;
    } else if (this.props.samplingState === 'outdated') {
      banner = <this.statusRow style="warning">{OUTDATED_WARNING}</this.statusRow>;
    } else {
      banner = (
        <this.samplingMessage
          sampleSize={this.props.schema ? this.props.schema.count : 0}
        />
      );
    }
    return banner;
  }

  renderFieldList() {
    let fieldList = null;
    if (_.includes(['outdated', 'complete'], this.props.samplingState)) {
      fieldList = _.get(this.props.schema, 'fields', []).map((field) => {
        return <Field key={field.name} {...field} />;
      });
    }
    return fieldList;
  }

  /**
   * Render the schema
   *
   * @returns {React.Component} The schema view.
   */
  render() {
    this._updateProgressBar();

    return (
      <div className="header-margin">
        <this.queryBar
          buttonLabel="Sample"
          onApply={this.onApplyClicked.bind(this)}
          onReset={this.onResetClicked.bind(this)}
        />
        {this.renderBanner()}
        <div className="column-container with-refinebar-and-message">
          <div className="column main">
            <div className="schema-field-list">
              {this.renderFieldList()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Schema.propTypes = {
  samplingState: React.PropTypes.oneOf(['initial', 'counting', 'sampling',
    'analyzing', 'complete', 'error', 'outdated']),
  samplingProgress: React.PropTypes.number,
  samplingTimeMS: React.PropTypes.number,
  maxTimeMS: React.PropTypes.number,
  schema: React.PropTypes.any
};

Schema.defaultProps = {
};

Schema.displayName = 'Schema';

module.exports = Schema;
