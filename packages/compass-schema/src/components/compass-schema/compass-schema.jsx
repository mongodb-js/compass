/* eslint react/no-multi-comp:0 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StatusRow, Tooltip, ZeroState } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import Field from 'components/field';
import StatusSubview from 'components/status-subview';
import SamplingMessage from 'components/sampling-message';
import { TOOLTIP_IDS } from 'constants';
import _ from 'lodash';

const QUERYBAR_LAYOUT = ['filter', ['project', 'limit']];

const OUTDATED_WARNING = 'The schema content is outdated and no longer in sync'
  + ' with the documents view. Press "Analyze" again to see the schema for the'
  + ' current query.';

const ERROR_WARNING = 'An error occurred during schema analysis';

const HEADER = 'Explore your schema';

const SUBTEXT = 'Quickly visualize your schema to understand the frequency, types and ranges of'
  + '\xa0fields in your data set.';

const DOCUMENTATION_LINK = 'https://docs.mongodb.com/compass/master/schema/';

/**
 * Component for the entire schema view component.
 */
class Schema extends Component {
  static displayName = 'SchemaComponent';

  static propTypes = {
    actions: PropTypes.object,
    globalAppRegistry: PropTypes.object.isRequired,
    samplingState: PropTypes.oneOf([
      'initial',
      'counting',
      'sampling',
      'analyzing',
      'error',
      'complete',
      'outdated'
    ]),
    samplingProgress: PropTypes.number,
    samplingTimeMS: PropTypes.number,
    errorMessage: PropTypes.string,
    maxTimeMS: PropTypes.number,
    schema: PropTypes.any,
    count: PropTypes.number
  }

  componentWillMount() {
    this.StatusAction = this.props.globalAppRegistry.getAction('Status.Actions');
    this.queryBar = this.props.globalAppRegistry.getComponent('Query.QueryBar');
  }

  componentDidUpdate() {
    // when the namespace changes and the schema tab is not active, the
    // tab is "display:none" and its width 0. That also means the the minichart
    // auto-sizes to 0. Therefore, when the user switches back to the tab,
    // making it "display:block" again and giving it a proper non-zero size,
    // the minicharts have to be re-rendered.
    //
    // if (this.CollectionStore.getActiveTab() === 1) {
    //   this.props.actions.resizeMiniCharts();
    //   ReactTooltip.rebuild();
    // }
  }

  onApplyClicked() {
    this.props.actions.startSampling();
  }

  onResetClicked() {
    this.props.actions.startSampling();
  }

  /**
   * updates the progress bar according to progress of schema sampling.
   * The count is indeterminate (trickling), and sampling/analyzing is
   * increased in 5% steps.
   */
  _updateProgressBar() {
    if (this.props.samplingState === 'error') {
      this.StatusAction.hide();
      return;
    }
    const progress = this.props.samplingProgress;
    // initial schema phase, cannot measure progress, enable trickling
    if (this.props.samplingProgress === -1) {
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
        const StatusStore = this.props.globalAppRegistry.getStore('Status.Store');
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
    if (this.props.samplingState === 'outdated') {
      banner = <StatusRow style="warning">{OUTDATED_WARNING}</StatusRow>;
    } else if (this.props.samplingState === 'error') {
      banner = <StatusRow style="error">{ERROR_WARNING}: {this.props.errorMessage}</StatusRow>;
    } else {
      banner = (
        <SamplingMessage
          sampleSize={this.props.schema ? this.props.schema.count : 0}
          count={this.props.count} />
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
   * Renders the zero state during the initial state; renders the schema if not.
   */
  renderContent() {
    if (this.props.samplingState === 'initial') {
      return (
        <div className="root">
          <div className="zero-graphic zero-graphic-schema"></div>
          <ZeroState
            header={HEADER}
            subtext={SUBTEXT}>
            <TextButton
              className="btn btn-primary btn-lg"
              text="Analyze Schema"
              clickHandler={this.onApplyClicked.bind(this)} />
            <a className="zero-state-link" href={DOCUMENTATION_LINK}>
              Learn more about schema analysis in Compass
            </a>
          </ZeroState>
        </div>
      );
    }
    return (
      <div className="column-container">
        <div className="column main">
          <div className="schema-field-list">
            {this.renderFieldList()}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render the schema
   *
   * @returns {React.Component} The schema view.
   */
  render() {
    this._updateProgressBar();

    return (
      <div className="content-container content-container-schema schema-container">
        <div className="controls-container">
          <this.queryBar
            layout={QUERYBAR_LAYOUT}
            buttonLabel="Analyze"
            onApply={this.onApplyClicked.bind(this)}
            onReset={this.onResetClicked.bind(this)} />
          {this.renderBanner()}
        </div>
        {this.renderContent()}
        <Tooltip
          id={TOOLTIP_IDS.SCHEMA_PROBABILITY_PERCENT}
          className="opaque-tooltip" />
      </div>
    );
  }
}

export default Schema;
