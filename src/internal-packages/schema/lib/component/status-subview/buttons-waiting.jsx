const app = require('hadron-app');
const React = require('react');
const PropTypes = require('prop-types');
const { shell } = require('electron');
const { InfoSprinkle } = require('hadron-react-components');
const { LONG_RUNNING_QUERIES_URL } = require('./constants');
const SchemaAction = require('../../action');

// const debug = require('debug')('mongodb-compass:schema:status-subview:buttons-waiting');

const SHOW_WAITING_BUTTONS_TIME_MS = 15000;

/**
 * Component for the entire document list.
 */
class ButtonsWaiting extends React.Component {
  onStopPartialButton() {
    SchemaAction.stopSampling();
    const StatusAction = app.appRegistry.getAction('Status.Actions');
    if (StatusAction !== undefined) {
      StatusAction.hide();
    }
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
    const NOOP = () => {};

    return (
      <div className="buttons" style={buttonStyle}>
        <div id="buttons-waiting">
          <div className="alert alert-info" role="alert">
            Document analysis is taking longer than expected. &nbsp;
            <a onClick={() => {shell.openExternal(LONG_RUNNING_QUERIES_URL);}}>
              Learn More
              <InfoSprinkle
                helpLink={LONG_RUNNING_QUERIES_URL}
                onClickHandler={NOOP}
              />
            </a>
          </div>
          <br />
          <button
            className="btn btn-sm btn-info"
            onClick={this.onStopPartialButton.bind(this)}>
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
