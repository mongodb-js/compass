const app = require('hadron-app');
const React = require('react');
const SchemaAction = require('../../action');

// const debug = require('debug')('mongodb-compass:schema:status-subview:buttons-waiting');

const SHOW_WAITING_BUTTONS_TIME_MS = 15000;

/**
 * Component for the entire document list.
 */
const ButtonsWaiting = React.createClass({
  propTypes: {
    samplingTimeMS: React.PropTypes.number.isRequired,
    samplingState: React.PropTypes.string.isRequired
  },

  onStopPartialButton() {
    SchemaAction.stopSampling();
    const StatusAction = app.appRegistry.getAction('Status.Actions');
    if (StatusAction !== undefined) {
      StatusAction.hide();
    }
  },

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
          <div className="btn btn-info" onClick={this.onStopPartialButton}>
            Stop and show partial results
          </div>
        </div>
      </div>
    );
  }
});

module.exports = ButtonsWaiting;
