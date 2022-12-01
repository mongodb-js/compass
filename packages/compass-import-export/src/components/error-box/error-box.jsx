import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { palette } from '@mongodb-js/compass-components';

import ANSIConverter from 'ansi-to-html';

import styles from './error-box.module.less';
import createStyler from '../../utils/styler';
const style = createStyler(styles, 'error-box');

/**
 * TODO: lucas: Sync hex values against palatte
 * once we start actually produce ansi.
 */
const ANSI_TO_HTML_OPTIONS = {
  fg: palette.white,
  bg: palette.black,
  newline: true,
  escapeXML: true,
  stream: false,
};

function getPrettyErrorMessage(message) {
  return new ANSIConverter(ANSI_TO_HTML_OPTIONS).toHtml(message);
}

class ErrorBox extends PureComponent {
  static propTypes = {
    message: PropTypes.string,
    dataTestId: PropTypes.string,
  };
  render() {
    if (!this.props.message) {
      return null;
    }
    const prettyError = getPrettyErrorMessage(this.props.message);
    return (
      <div
        data-testid={this.props.dataTestId}
        className={style()}
        dangerouslySetInnerHTML={{ __html: prettyError }}
      />
    );
  }
}

export default ErrorBox;
