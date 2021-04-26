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
        className={classnames(styles['zero-graphic'])}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 42 48"
      >
        <g
          fill="none"
          fillRule="evenodd"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transform="translate(1 1)"
        >
          <path stroke="#16CC62" d="M20,0 L20,6"/>
          <path stroke="#116149" d="M18,0 L22,0"/>
          <path stroke="#16CC62" d="M37.5,7.5 L33.632,11.368"/>
          <path stroke="#116149" d="M36 6L39 9M6 26L10 26M10 16L13 19M10 36L13 33M34 26L30 26M20 40L20 36M20 12L20 16M30 36L27 33M30 16L27 19"/>
          <path stroke="#16CC62" d="M40,26 C40,37.044 31.044,46 20,46 C8.954,46 0,37.044 0,26 C0,14.956 8.954,6 20,6 C31.044,6 40,14.956 40,26 L40,26 Z"/>
        </g>
      </svg>
    );
  }
}

export default ZeroGraphic;
