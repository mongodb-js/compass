const React = require('react');
const Actions = require('../actions');
const ServerStatsStore = require('../stores/server-stats-graphs-store');

// const debug = require('debug')('mongodb-compass:server-stats:time-and-pause-button');

class TimeAndPauseButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      paused: ServerStatsStore.isPaused
    };
  }

  handlePause() {
    this.setState({
      paused: !this.state.paused
    });
    Actions.pause();
  }

  render() {
    return (
      <div className="time-and-pause action-bar">
        <button
          onClick={this.handlePause.bind(this)}
          className="play btn btn-xs btn-primary"
          data-test-id="performance-play"
          style={{display: this.state.paused ? null : 'none'}}>
          <text className="playbutton">
            <i className="fa fa-play"></i>
            PLAY
          </text>
        </button>
        <button
          onClick={this.handlePause.bind(this)}
          className="pause btn btn-default btn-xs"
          data-test-id="performance-pause"
          style={{display: this.state.paused ? 'none' : null}}>
          <text className="pausebutton">
            <i className="fa fa-pause"></i>
            PAUSE
          </text>
        </button>
        <div className="time"><text className="currentTime">00:00:00</text></div>
      </div>
    );
  }
}

TimeAndPauseButton.propTypes = {
  paused: React.PropTypes.bool.isRequired
};

TimeAndPauseButton.defaultProps = {
  paused: false
};

TimeAndPauseButton.displayName = 'TimeAndPauseButton';

module.exports = TimeAndPauseButton;
