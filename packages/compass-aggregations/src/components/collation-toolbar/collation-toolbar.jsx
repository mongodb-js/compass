import React, { PureComponent } from 'react';
import { InfoSprinkle } from 'hadron-react-components';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './collation-toolbar.less';

/**
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

/**
 * The collation toolbar component.
 */
class CollationToolbar extends PureComponent {
  static displayName = 'CollationToolbarComponent';

  static propTypes = {
    collation: PropTypes.string,
    collationChanged: PropTypes.func.isRequired,
    isCollationValid: PropTypes.bool,
    collationValidated: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired
  };

  static defaultProps = { collation: '', isCollationValid: true};

  state = { hasFocus: false };

  /**
   * Changes collation state.
   *
   * @param {Object} evt - Collation options.
   */
  onCollationChange = (evt) => {
    this.props.collationChanged(evt.target.value);
    this.props.collationValidated(evt.target.value);
  };

  /**
   * Sets collation input focus
   */
  _onFocus = () => {
    this.setState({ hasFocus: true });
  };

  /**
   * Removes collation input focus
   */
  _onBlur = () => {
    this.setState({ hasFocus: false });
  };

  /**
   * Renders the collation toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['collation-toolbar'])}>
        <div
          onBlur={this._onBlur}
          onFocus={this._onFocus}
          className={classnames(
            styles['collation-toolbar-input-wrapper'],
            { [ styles['has-focus'] ]: this.state.hasFocus }
          )}
        >
          <div
            className={classnames(
              styles['collation-toolbar-input-label'],
              { [ styles['has-error'] ]: !this.props.isCollationValid }
            )}
            data-test-id="collation-toolbar-input-label">
            <InfoSprinkle helpLink={HELP_URL_COLLATION} onClickHandler={this.props.openLink} />
            Collation
          </div>
          <input
            placeholder="{ locale: 'simple' }"
            type="text"
            onChange={this.onCollationChange}
            value={this.props.collation} />
        </div>
      </div>
    );
  }
}

export default CollationToolbar;
