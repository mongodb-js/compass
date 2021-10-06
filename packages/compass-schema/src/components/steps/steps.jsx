import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ANALYSIS_STATE_ANALYZING } from '../../constants/analysis-states';

/**
 * Component for the entire document list.
 */
class SchemaSteps extends Component {
  static displayName = 'SchemaStepsComponent';

  static propTypes = {
    analysisState: PropTypes.string.isRequired,
    actions: PropTypes.object.isRequired
  }

  onStopClicked() {
    this.props.actions.stopAnalysis();
  }

  renderStopButton() {
    if (this.props.analysisState !== ANALYSIS_STATE_ANALYZING) {
      return;
    }

    return (
      <div className="buttons">
        <div id="buttons-waiting">
          <button
            className="btn btn-sm btn-info"
            onClick={this.onStopClicked.bind(this)}>
            Stop
          </button>
        </div>
      </div>
    );
  }

  render() {
    const iconClassName = 'fa fa-fw fa-spin fa-circle-o-notch';
    const text = 'Analyzing Documents';

    return (
      <div>
        <ul className="steps">
          <li id="analysis-step">
            <i className={iconClassName} />
            {text}
          </li>
        </ul>
        {this.renderStopButton()}
      </div>
    );
  }
}

export default SchemaSteps;
