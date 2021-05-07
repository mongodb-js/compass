import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './loading.less';

class Loading extends Component {
  static displayName = 'LoadingComponent';
  static propTypes = {
    status: PropTypes.string.isRequired
  }

  /**
   * Render Loading component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.loading)}>
        <svg
          className={classnames(styles['loading-spinner'])}
          aria-hidden="true"
          focusable="false"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          height="102"
          viewBox="0 0 102 102"
          fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-1.33757e-05 51C-4.5151e-06 22.8335 22.8335 -2.33115e-07 51 2.22928e-06C79.1665 4.69168e-06 102 22.8335 102 51C102 79.1665 79.1665 102 51 102C22.8335 102 -1.46069e-05 79.1665 -1.33757e-05 51ZM51 96.5599C25.838 96.5599 5.44005 76.1619 5.44005 50.9999C5.44005 25.8378 25.838 5.43986 51 5.43986C76.1621 5.43986 96.56 25.8378 96.56 50.9999C96.56 76.162 76.1621 96.5599 51 96.5599Z"
            fill="url(#compass_loading_spinner_linear_grad)"/>
          <defs>
            <linearGradient id="compass_loading_spinner_linear_grad" x1="102" y1="51" x2="2.30067e-06" y2="51" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5D6C74"/>
              <stop offset="1" stopColor="white"/>
            </linearGradient>
          </defs>
        </svg>
        <div className={classnames(styles['loading-status'])}>
          {this.props.status}
        </div>
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  status: state.status
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedLoading = connect(
  mapStateToProps,
  {
  },
)(Loading);

export default MappedLoading;
export { Loading };
