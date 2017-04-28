const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:schema:status-subview:steps');

const SHOW_STEPS_TIME_MS = 3000;

/**
 * Component for the entire document list.
 */
class SchemaSteps extends React.Component {

  getInitialState() {
    return {
      errorState: null
    };
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
    if (_.contains(['counting', 'sampling'], this.props.samplingState)) {
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

SchemaSteps.propTypes = {
  samplingTimeMS: PropTypes.number.isRequired,
  samplingState: PropTypes.string.isRequired
};

module.exports = SchemaSteps;
