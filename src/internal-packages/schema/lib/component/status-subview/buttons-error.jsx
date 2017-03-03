const app = require('hadron-app');
const React = require('react');
const ms = require('ms');

// const debug = require('debug')('mongodb-compass:schema:status-subview:buttons-error');

const RETRY_INC_MAXTIMEMS_VALUE = 60000;
/**
 * Component for the entire document list.
 */
const ButtonsError = React.createClass({
  propTypes: {
    maxTimeMS: React.PropTypes.number.isRequired,
    samplingState: React.PropTypes.string.isRequired
  },

  componentWillMount() {
    this.StatusAction = app.appRegistry.getAction('Status.Actions');
    this.SchemaAction = app.appRegistry.getAction('Schema.Actions');
  },

  onTryAgainButtonClick() {
    // increase maxTimeMS and sample again
    this.SchemaAction.setMaxTimeMS(RETRY_INC_MAXTIMEMS_VALUE);
    this.SchemaAction.startSampling();
  },

  onNewQueryButtonClick() {
    // dismiss status view
    this.StatusAction.hide();
  },

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
          onClick={this.onTryAgainButtonClick}>
          Try for 1 minute
        </button>
      );
    }
    return null;
  },

  render() {
    // if sampling state is not `error`, don't show this component
    if (this.props.samplingState !== 'timeout') {
      return null;
    }

    const sampleTime = ms(this.props.maxTimeMS, {long: true});
    const tryAgainButton = this._getTryAgainButton();

    return (
      <div className="buttons">
        <div id="buttons-error">
          <div className="alert alert-warning" role="alert">
            The query took longer than {sampleTime} on the database.
            As a safety measure, Compass aborts long-running queries. &nbsp;
            <a className="help" data-hook="schema-long-running-queries">
              Learn More
              <i className="fa fa-fw fa-info-circle"></i>
            </a>
          </div>
          <br />
          {tryAgainButton}
          <button
            className="btn btn-sm btn-info"
            onClick={this.onNewQueryButtonClick}>
            Create New Query
          </button>
        </div>
      </div>
    );
  }
});

module.exports = ButtonsError;
