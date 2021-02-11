import { Link } from '@leafygreen-ui/typography';
import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';

import ConnectingAnimation from './connecting-animation';
import Actions from '../../actions';
import Illustration from '../../assets/svg/connecting-illustration.svg';
import styles from '../connect.less';

// We delay showing the modal for this amount of time to avoid flashing.
const showModalDelayMS = 250;

/**
 * Modal shown when attempting to connect.
 */
class Connecting extends React.Component {
  static propTypes = {
    connectingStatusText: PropTypes.string.isRequired,
    currentConnectionAttempt: PropTypes.object
  };

  state = {
    showModal: false
  };

  componentDidUpdate = () => {
    if (
      this.props.currentConnectionAttempt
      && !this.showModalDebounceTimeout
      && !this.state.showModal
    ) {
      this.showModalDebounceTimeout = window.setTimeout(
        () => {
          if (this.props.currentConnectionAttempt) {
            this.startShowingModal();
          }
          this.showModalDebounceTimeout = null;
        },
        showModalDelayMS
      );
    }

    if (!this.props.currentConnectionAttempt && this.state.showModal) {
      this.stopShowingModal();
    }
  }

  componentWillUnmount = () => {
    if (this.showModalDebounceTimeout) {
      window.clearTimeout(this.showModalDebounceTimeout);
      this.showModalDebounceTimeout = null;
    }
  }

  onCancelConnectionClicked = () => {
    Actions.onCancelConnectionAttemptClicked();
  };

  startShowingModal = () => {
    this.setState({
      showModal: true
    });
  }

  stopShowingModal = () => {
    this.setState({
      showModal: false
    });
  }

  showModalDebounceTimeout = null;

  /**
   * @returns {React.Component} The background for the connecting modal.
   */
  renderConnectingBackground = () => {
    return (
      <svg
        className={styles['connecting-background']}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 310.34 540.72"
      >
        <defs>
          <linearGradient
            id="linearGradient"
            x1="-0.69"
            y1="540.32"
            x2="311.03"
            y2="0.4"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0.09"
              stopColor="#ffe1ea"
              stopOpacity="0.34"
            />
            <stop
              offset="0.74"
              stopColor="#c5e4f2"
              stopOpacity="0.61"
            >
              <animate
                attributeName="offset"
                from="0.74"
                to="0.74"
                dur="5s"
                repeatCount="indefinite"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                values="0.74;0.45;0.74"
              />
            </stop>
            <stop
              offset="1"
              stopColor="#fef2c8"
              stopOpacity="0.8"
            />
          </linearGradient>
        </defs>
        <g>
          <rect
            fill="url(#linearGradient)"
            className={styles['connecting-background-gradient']}
            width="310.34"
            height="540.72"
          />
        </g>
      </svg>
    );
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <React.Fragment>
        {!!this.props.currentConnectionAttempt && this.renderConnectingBackground()}
        <Modal
          animation={false}
          show={this.state.showModal && !!this.props.currentConnectionAttempt}
          backdropClassName={styles['connecting-modal-backdrop']}
        >
          <Modal.Body>
            <div
              className={styles['connecting-modal-content']}
              id="connectingStatusText"
            >
              <img
                className={styles['connecting-modal-illustration']}
                src={Illustration}
                alt="Compass connecting illustration"
              />
              <h2
                className={styles['connecting-modal-status']}
              >
                {this.props.connectingStatusText}
              </h2>
              <ConnectingAnimation />
              <Link
                tabIndex={0}
                onClick={this.onCancelConnectionClicked}
                hideExternalIcon
                className={styles['connecting-modal-cancel-btn']}
              >
                Cancel
              </Link>
            </div>
          </Modal.Body>
        </Modal>
      </React.Fragment>
    );
  }
}

export default Connecting;
