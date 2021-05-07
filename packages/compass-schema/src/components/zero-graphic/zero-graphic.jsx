import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './zero-graphic.less';

/**
 * The zero graphic component.
 */
class ZeroGraphic extends Component {
  static displayName = 'ZeroGraphic';

  /**
   * Render the zero graphic.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={classnames(styles['zero-graphic'])}
        viewBox="0 0 60 40">
        <g
          fill="none"
          fillRule="evenodd"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          transform="translate(1 1)">

          <polyline stroke="#16CC62" points="10.25 37.75 10.25 25.25 2.75 25.25 2.75 37.75"/>
          <polyline stroke="#16CC62" points="40.5 37.5 40.5 10 33 10 33 37.5"/>
          <polyline stroke="#16CC62" points="25.25 37.75 25.25 17.75 17.75 17.75 17.75 37.75"/>
          <polyline stroke="#16CC62" points="55.5 37.5 55.5 0 48 0 48 37.5"/>
          <path stroke="#116149" d="M0.25,37.75 L57.75,37.75"/>
        </g>
      </svg>
    );
  }
}

export default ZeroGraphic;
