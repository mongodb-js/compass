const React = require('react');
const debug = require('debug')('mongodb-compass:navbar-component');

class NavBarComponent extends React.Component {
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
        <div className="play"><text className="playbutton">&#9658; PLAY</text></div>
      </header>
    );
  }
}

module.exports = NavBarComponent;
