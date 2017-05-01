const React = require('react');
const createReactClass = require('create-react-class');
const StatusStore = require('../store');
const StateMixin = require('reflux-state-mixin');

// const debug = require('debug')('mongodb-compass:status');

const STATUS_ID = 'statusbar';

/**
 * Component for the entire document list.
 */
const Status = createReactClass({

  mixins: [ StateMixin.connect(StatusStore) ],

  /**
   * Render the status elements: progress bar, message container, sidebar,
   * animation container, subview container, ...
   *
   * @returns {React.Component} The status view.
   */
  render() {
    // derive styles from status state
    const visible = this.state.visible ? '' : 'hidden';
    const progressBarWidth = this.state.progress;
    const progressBarHeight = 4;
    const outerBarStyle = {
      display: this.state.progressbar ? 'block' : 'none',
      height: progressBarHeight
    };
    const innerBarStyle = {
      width: `${progressBarWidth}%`
    };
    const messageStyle = {
      visibility: this.state.message !== '' ? 'visible' : 'hidden'
    };
    const animationStyle = {
      visibility: this.state.animation ? 'visible' : 'hidden'
    };
    const sidebarStyle = {
      display: this.state.sidebar ? 'block' : 'none'
    };

    // create subview component if state.subview is set
    let statusSubview = null;
    if (this.state.subview) {
      const SubView = this.state.subview;
      statusSubview = <SubView {...this.state} />;
    }

    return (
      <div id={STATUS_ID} className={visible}>
        <div className="progress" style={outerBarStyle}>
          <div className="progress-bar progress-bar-striped active" style={innerBarStyle}>
          </div>
        </div>
        <div className="sidebar" style={sidebarStyle}>
        </div>
        <ul className="message-background with-sidebar centered">
          <li>
            <p className="message" style={messageStyle}>
              {this.state.message}
            </p>
            <div className="spinner" style={animationStyle}>
              <div className="rect1"></div>
              <div className="rect2"></div>
              <div className="rect3"></div>
              <div className="rect4"></div>
              <div className="rect5"></div>
            </div>
            <div className="subview">
              {statusSubview}
            </div>
          </li>
        </ul>
      </div>
    );
  }
});

module.exports = Status;
