import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from '../connect.less';

/**
 * Default colors.
 */
const COLORS = ['#5fc86e', '#326fde', '#deb342', '#d4366e', '#59c1e2', '#2c5f4a', '#d66531', '#773819', '#3b8196', '#ababab'];

class FavoriteColorPicker extends React.Component {
  static displayName = 'FavoriteColorPicker';

  static propTypes = {
    colors: PropTypes.array,
    hex: PropTypes.string,
    onChange: PropTypes.func
  }

  static defaultProps = { colors: COLORS };

  /**
   * Renders the color box.
   *
   * @param {String} hex - The hex representation of the color.
   *
   * @returns {React.Component}
   */
  renderColor(hex) {
    const colorBoxClass = {
      [styles['color-box']]: true,
      [styles['color-box-active']]: (this.props.hex === hex)
    };

    return (
      <div
        className={classnames(colorBoxClass)}
        onClick={this.props.onChange.bind(this, hex)}
        title={hex}
        key={hex}>
        <div
          style={{ background: hex }}
          className={classnames(styles.color)}>
          <svg
            className={classnames(styles.checkmark)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <g
              fill="white"
              transform="translate(1 1)"
              fillOpacity={(this.props.hex === hex) ? 1 : 0}
              strokeOpacity={(this.props.hex === hex) ? 1 : 0}
            >
              <path stroke="#ffffff" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
            </g>
          </svg>
        </div>
      </div>
    );
  }

  /**
   * Renders the favorite color picker.
   *
   * @returns {React.Component}
   */
  render() {
    const colorBoxClass = {
      [styles['color-box']]: true,
      [styles['color-box-active']]: (this.props.hex === undefined)
    };

    return (
      <div className={classnames(styles['favorite-picker'])}>
        <div
          className={classnames(colorBoxClass)}
          onClick={this.props.onChange.bind(this, undefined)}
          title="No color"
          key="noColor">
          <div
            style={{ background: '#ffffff' }}
            className={classnames(styles.color, styles['grey-border'])}>
            <div className={classnames(styles['red-line'])} />
          </div>
        </div>
        {COLORS.map(this.renderColor.bind(this))}
      </div>
    );
  }
}

export default FavoriteColorPicker;
