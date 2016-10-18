const React = require('react');
const Actions = require('../actions');
const debug = require('debug')('mongodb-compass:navbar-component');
const jQuery = require('jquery');

class NavBarComponent extends React.Component {
  constructor() {
    super();
    this.state = {
      paused: false
    };
    this.handlePause = this.handlePause.bind(this);
  }
  handlePause() {
    this.setState({ paused: !this.state.paused });
    Actions.pause();
    jQuery('#div-scroll').scrollTop(0);
  }

  goToPerformance() {
    debug('CALLING PERF BUTTON');
  }
  goToDatabases() {
    debug('CALLING DB BUTTON');
  }
  render() {
    return (
      <header className="rt-nav">
        <ul className="rt-nav__tabs">
          <li className="rt-nav__tab rt-nav--selected">
            <a onClick={this.goToPerformance} className="rt-nav__link">Performance</a>
          </li>
          <li className="rt-nav__tab">
            <a onClick={this.goToDatabases} className="rt-nav__link">Databases</a>
          </li>
        </ul>
        <div className="time"><text className="currentTime">00:00:00</text></div>
        <div onClick={this.handlePause} className="play" style={{display: this.state.paused ? null : 'none'}}><text className="playbutton"><i className="fa fa-play"></i>PLAY</text></div>
        <div onClick={this.handlePause} className="pause" style={{display: this.state.paused ? 'none' : null}}><text className="pausebutton"><i className="fa fa-pause"></i>PAUSE</text></div>
      </header>
    );
  }
}

module.exports = NavBarComponent;
