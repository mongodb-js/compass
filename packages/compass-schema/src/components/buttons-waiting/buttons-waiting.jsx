import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { InfoSprinkle } from 'hadron-react-components';
import CONSTANTS from 'constants/schema';

const SHOW_WAITING_BUTTONS_TIME_MS = 15000;

/**
 * Component for the entire document list.
 */
class ButtonsWaiting extends Component {
  static displayName = 'ButtonsWaitingComponent';

  static propTypes = {
    globalAppRegistry: PropTypes.object.isRequired,
    samplingTimeMS: PropTypes.number.isRequired,
    samplingState: PropTypes.string.isRequired,
    subviewActions: PropTypes.object.isRequired
  }

  onStopPartialButton() {
    this.props.subviewActions.stopSampling();
    this.props.globalAppRegistry.emit('compass:status:hide');
  }

  _openLink(link) {
    const { shell } = require('electron');
    shell.openExternal(link);
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
            <a onClick={() => {this._openLink(CONSTANTS.LONG_RUNNING_QUERIES_URL);}}>
              Learn More
              <InfoSprinkle
                helpLink={CONSTANTS.LONG_RUNNING_QUERIES_URL}
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

export default ButtonsWaiting;
