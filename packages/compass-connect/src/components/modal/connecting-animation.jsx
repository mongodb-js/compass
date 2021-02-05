import React from 'react';

import styles from '../connect.less';

// This function returns the speed at which the needle shoots off in
// a direction. The farther from 0 the number, the farther/faster it goes.
const getNewRotationVelocity = () => {
  return (
    Math.PI / (170 + (Math.random() * 100))
  ) * (
    Math.random() > 0.5 ? 1 : -1
  );
};

// How fast the needle returns to the center mark.
const rotationAcceleration = Math.PI / 90000;
// Closer to 0 the more friction/slowdown overtime there is (1 is no friction).
const friction = 0.974;

/**
 * Animated compass shown when attempting to connect.
 */
class ConnectingAnimation extends React.Component {
  componentDidMount() {
    this.mounted = true;
    this.startAnimation();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  currentRotation = 0;
  rotationVelocity = 0;
  lastFrame = Date.now();

  startAnimation = () => {
    this.lastFrame = Date.now();
    this.currentRotation = 0;
    this.rotationVelocity = getNewRotationVelocity();

    window.requestAnimationFrame(this.updateAnimation);
  }

  updateAnimation = () => {
    if (!this.mounted) {
      return;
    }

    if (Date.now() - this.lastFrame > 20) {
      // When the user returns from an unfocused view we disregard
      // that last frame time for a frame.
      this.lastFrame = Date.now();
    }

    const deltaTime = Date.now() - this.lastFrame;

    const arrow1 = document.getElementById('connectingArrow1');
    if (arrow1) {
      arrow1.setAttribute(
        'transform',
        `rotate(${this.currentRotation * (180 / Math.PI)}, 24.39, 39.2)`
      );
    }
    const arrow2 = document.getElementById('connectingArrow2');
    if (arrow2) {
      arrow2.setAttribute(
        'transform',
        `rotate(${this.currentRotation * (180 / Math.PI)}, 24.39, 39.2)`
      );
    }

    this.currentRotation += this.rotationVelocity * deltaTime;
    this.rotationVelocity += rotationAcceleration * (this.currentRotation > 0 ? -1 : 1) * deltaTime;
    this.rotationVelocity *= friction;

    if (
      Math.abs(this.rotationVelocity) < Math.PI / 1100
      && Math.abs(this.currentRotation) < Math.PI / 1100
    ) {
      // When the Compass hands are settled we apply a force so
      // it starts to rotate again.
      this.rotationVelocity = getNewRotationVelocity();
    }

    this.lastFrame = Date.now();

    window.requestAnimationFrame(this.updateAnimation);
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div
        className={styles['connecting-modal-animation']}
      >
        <svg
          className={styles['connecting-compass-animation-svg']}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 50.82 64.05"
        >
          <g>
            <circle
              className={styles['connecting-compass-shadow-stroke']}
              cx="26.15"
              cy="9.86"
              r="8.47"
            />
            <circle
              className={styles['connecting-compass-circle-1']}
              cx="24.39"
              cy="9.86"
              r="8.47"
            />
            <circle
              className={styles['connecting-compass-shadow']}
              cx="26.15"
              cy="39.2"
              r="24.38"
            />
            <circle
              className={styles['connecting-compass-circle-2']}
              cx="24.39"
              cy="39.2"
              r="24.39"
            />
            <circle
              className={styles['connecting-compass-circle-3']}
              cx="24.39"
              cy="39.37"
              r="20.1"
            />

            <polygon
              id="connectingArrow1"
              className={styles['connecting-compass-arrow-1']}
              points="24.39 22.62 21.35 39.2 27.43 39.2 24.39 22.62"
            />
            <polygon
              id="connectingArrow2"
              className={styles['connecting-compass-arrow-2']}
              points="24.39 55.77 27.43 39.2 21.35 39.2 24.39 55.77"
            />
          </g>
        </svg>
      </div>
    );
  }
}

export default ConnectingAnimation;
