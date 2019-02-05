import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './zero-graphic.less';

/**
 * The zero graphic.
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
        viewBox="0 0 60 48"
      >
        <g fill="none" fillRule="evenodd" strokeLinejoin="round" strokeWidth="2" transform="translate(1 1)">
          <polyline stroke="#16CC62" strokeLinecap="round" points="22.75 22.75 .25 22.75 .25 .25 57.75 .25 57.75 15.303"/>
          <path stroke="#116149" strokeLinecap="round" d="M10.25 6.5L10.25 16.5M14.43225 8.75825L6.06975 14.24075M14.41025 14.276L6.09025 8.7235M25.25 6.5L25.25 16.5M29.43225 8.75825L21.06975 14.24075M29.41025 14.276L21.09025 8.7235"/>
          <path stroke="#116149" d="M57.75,30.355 C57.75,38.6375 51.0325,45.355 42.75,45.355 C34.4625,45.355 27.75,38.6375 27.75,30.355 C27.75,22.0725 34.4625,15.355 42.75,15.355 C51.0325,15.355 57.75,22.0725 57.75,30.355 L57.75,30.355 Z"/>
          <polyline stroke="#16CC62" strokeLinecap="round" points="50.25 26.605 41.5 36.195 35.25 29.945"/>
        </g>
      </svg>
    );
  }
}

export default ZeroGraphic;
