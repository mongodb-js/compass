import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import ANSIConverter from 'ansi-to-html';

import styles from './error-box.less';
import createStyler from 'utils/styler.js';
const style = createStyler(styles, 'error-box');

/**
 * TODO: lucas: Sync hex values against palatte
 * once we start actually produce ansi.
 */
const ANSI_TO_HTML_OPTIONS = {
  fg: '#FFF',
  bg: '#000',
  newline: true,
  escapeXML: true,
  stream: false
};

const getPrettyErrorMessage = function(err) {
  return new ANSIConverter(ANSI_TO_HTML_OPTIONS).toHtml(err.message);
};

class ErrorBox extends PureComponent {
  static propTypes = {
    error: PropTypes.object
  };
  render() {
    if (!this.props.error) {
      return null;
    }
    const prettyError = getPrettyErrorMessage(this.props.error);
    return (
      <div
        className={style()}
        dangerouslySetInnerHTML={{ __html: prettyError }}
      />
    );
  }
}

export default ErrorBox;
