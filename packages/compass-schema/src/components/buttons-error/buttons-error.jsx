import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ms from 'ms';
import { InfoSprinkle } from 'hadron-react-components';
import { LONG_RUNNING_QUERIES_URL } from 'constants';

const RETRY_INC_MAXTIMEMS_VALUE = 60000;

/**
 * Component for the entire document list.
 */
class ButtonsError extends React.Component {
  static displayName = 'ButtonsErrorComponent';

  static propTypes = {
    maxTimeMS: PropTypes.number.isRequired,
    samplingState: PropTypes.string.isRequired
  }

  componentWillMount() {
    this.StatusAction = global.hadronApp.appRegistry.getAction('Status.Actions');
    this.SchemaAction = global.hadronApp.appRegistry.getAction('Schema.Actions');
  }

  onTryAgainButtonClick() {
    // increase maxTimeMS and sample again
    this.SchemaAction.setMaxTimeMS(RETRY_INC_MAXTIMEMS_VALUE);
    this.SchemaAction.startSampling();
  }

  onNewQueryButtonClick() {
    // dismiss status view
    this.StatusAction.hide();
  }

  /**
   * only show the retry button if the maxTimeMS value hasn't been increased
   * yet (first time).
   *
   * @return {React.Component|null}   Retry button or null.
   */
  _getTryAgainButton() {
    if (this.props.maxTimeMS < RETRY_INC_MAXTIMEMS_VALUE) {
      return (
        <button
          className="btn btn-sm btn-info"
          onClick={this.onTryAgainButtonClick.bind(this)}>
          Try for 1 minute
        </button>
      );
    }
    return null;
  }

  _openLink(link) {
    const { shell } = require('electron');
    shell.openExternal(link);
  }

  render() {
    // if sampling state is not `error`, don't show this component
    if (this.props.samplingState !== 'timeout') {
      return null;
    }

    const sampleTime = ms(this.props.maxTimeMS, {long: true});
    const tryAgainButton = this._getTryAgainButton();
    const NOOP = () => {};

    return (
      <div className="buttons">
        <div id="buttons-error">
          <div className="alert alert-warning" role="alert">
            The query took longer than {sampleTime} on the database.
            As a safety measure, Compass aborts long-running queries. &nbsp;
            <a onClick={() => {this._openLink(LONG_RUNNING_QUERIES_URL);}}>
              Learn More
              <InfoSprinkle
                helpLink={LONG_RUNNING_QUERIES_URL}
                onClickHandler={NOOP}
              />
            </a>
          </div>
          <br />
          {tryAgainButton}
          <button
            className="btn btn-sm btn-info"
            onClick={this.onNewQueryButtonClick.bind(this)}>
            Create New Query
          </button>
        </div>
      </div>
    );
  }
}

export default ButtonsError;
