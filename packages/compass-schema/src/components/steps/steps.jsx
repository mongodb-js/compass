import React, { Component } from 'react';
import PropTypes from 'prop-types';
import includes from 'lodash.includes';

const SHOW_STEPS_TIME_MS = 3000;

/**
 * Component for the entire document list.
 */
class SchemaSteps extends Component {
  static displayName = 'SchemaStepsComponent';

  static propTypes = {
    samplingTimeMS: PropTypes.number.isRequired,
    samplingState: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);
    this.state = { errorState: null };
  }

  /**
   * remember the last known non-error state internally.
   *
   * @param  {Object} nextProps   next props of this component
   */
  componentWillReceiveProps(nextProps) {
    if (this.props.samplingState !== 'timeout' && nextProps.samplingState === 'timeout') {
      this.setState({
        errorState: this.props.samplingState
      });
    }
  }

  _getSamplingIndicator() {
    if (includes(['counting', 'sampling'], this.props.samplingState)) {
      return 'fa fa-fw fa-spin fa-circle-o-notch';
    }
    if (this.props.samplingState === 'analyzing' ||
      (this.props.samplingState === 'timeout' && this.state.errorState === 'analyzing')) {
      return 'mms-icon-check';
    }
    if (this.props.samplingState === 'timeout' && this.state.errorState === 'sampling') {
      return 'fa fa-fw fa-warning';
    }
    return 'fa fa-fw';
  }

  _getAnalyzingIndicator() {
    if (this.props.samplingState === 'analyzing') {
      return 'fa fa-fw fa-spin fa-circle-o-notch';
    }
    if (this.props.samplingState === 'complete') {
      return 'mms-icon-check';
    }
    if (this.props.samplingState === 'timeout' && this.state.errorState === 'analyzing') {
      return 'fa fa-fw fa-warning';
    }
    return 'fa fa-fw';
  }

  render() {
    // if below 3 second threshold, don't show this component
    const style = {
      visibility: (this.props.samplingTimeMS < SHOW_STEPS_TIME_MS) ?
        'hidden' : 'visible'
    };

    const samplingIndicator = this._getSamplingIndicator();
    const analyzingIndicator = this._getAnalyzingIndicator();

    return (
      <div style={style}>
        <ul className="steps">
          <li id="sampling-step">
            <i className={samplingIndicator}></i>
            Sampling Collection
          </li>
          <li id="analyzing-step">
            <i className={analyzingIndicator}></i>
            Analyzing Documents
          </li>
        </ul>
      </div>
    );
  }
}

export default SchemaSteps;
