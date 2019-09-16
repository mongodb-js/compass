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
          aria-hidden="true"
          focusable="false"
          data-prefix="fal"
          data-icon="compass"
          className="svg-inline--fa fa-spinner-third fa-w-16"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          height="15vh"
          viewBox="0 0 512 512">
          <path fill="#FFFFFF" d="M460.115 373.846l-6.941-4.008c-5.546-3.202-7.564-10.177-4.661-15.886 32.971-64.838 31.167-142.731-5.415-205.954-36.504-63.356-103.118-103.876-175.8-107.701C260.952 39.963 256 34.676 256 28.321v-8.012c0-6.904 5.808-12.337 12.703-11.982 83.552 4.306 160.157 50.861 202.106 123.67 42.069 72.703 44.083 162.322 6.034 236.838-3.14 6.149-10.75 8.462-16.728 5.011z">
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 256 256"
              to="360 256 256"
              dur="2s"
              repeatCount="indefinite"/>
          </path>
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
