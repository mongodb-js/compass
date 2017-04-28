const React = require('react');
const PropTypes = require('prop-types');
const SchemaAction = require('../../action');

// const debug = require('debug')('mongodb-compass:schema:status-subview:buttons-waiting');

const SHOW_WAITING_BUTTONS_TIME_MS = 15000;

/**
 * Component for the entire document list.
 */
class ButtonsWaiting extends React.Component {
  onStopPartialButton() {
    SchemaAction.stopSampling();
  }

  render() {
    // if in timeout state, don't show this component
    if (this.props.samplingState === 'timeout') {
      return null;
    }

    // if below 15 second threshold, hide this component
    const buttonStyle = {
      visibility: (this.props.samplingTimeMS < SHOW_WAITING_BUTTONS_TIME_MS) ?
        'hidden' : 'visible'
    };

    return (
      <div className="buttons" style={buttonStyle}>
        <div id="buttons-waiting">
          <div className="alert alert-info" role="alert">
            Document analysis is taking longer than expected. &nbsp;
            <a className="help" data-hook="schema-long-running-queries">
              Learn More
              <i className="fa fa-fw fa-info-circle"></i>
            </a>
          </div>
          <br />
          <button
            className="btn btn-sm btn-info"
            onClick={this.onStopPartialButton}>
            Stop and show partial results
          </button>
        </div>
      </div>
    );
  }
}

ButtonsWaiting.propTypes = {
  samplingTimeMS: PropTypes.number.isRequired,
  samplingState: PropTypes.string.isRequired
};

module.exports = ButtonsWaiting;
