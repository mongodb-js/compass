const React = require('react');
const PropTypes = require('prop-types');

// const debug = require('debug')('mongodb-compass:status');

const STATUS_ID = 'statusbar';

/**
 * Component for the entire document list.
 */
class Status extends React.Component {

  /**
   * Render the status elements: progress bar, message container, sidebar,
   * animation container, subview container, ...
   *
   * @returns {React.Component} The status view.
   */
  render() {
    // derive styles from status state
    const visible = this.props.visible ? '' : 'hidden';
    const progressBarWidth = this.props.progress;
    const progressBarHeight = 4;
    const outerBarStyle = {
      display: this.props.progressbar ? 'block' : 'none',
      height: progressBarHeight
    };
    const innerBarStyle = {
      width: `${progressBarWidth}%`
    };
    const messageStyle = {
      visibility: this.props.message !== '' ? 'visible' : 'hidden'
    };
    const animationStyle = {
      visibility: this.props.animation ? 'visible' : 'hidden'
    };
    const sidebarStyle = {
      display: this.props.sidebar ? 'block' : 'none'
    };

    // create subview component if state.subview is set
    let statusSubview = null;
    if (this.props.subview) {
      const SubView = this.props.subview;
      statusSubview = <SubView {...this.props} />;
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
              {this.props.message}
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
}

Status.propTypes = {
  visible: PropTypes.bool,
  progressbar: PropTypes.bool,
  progress: PropTypes.number,
  message: PropTypes.string,
  animation: PropTypes.bool,
  sidebar: PropTypes.bool,
  subview: PropTypes.any
};

module.exports = Status;
