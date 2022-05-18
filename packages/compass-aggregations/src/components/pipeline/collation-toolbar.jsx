import React, { PureComponent } from 'react';
import { InfoSprinkle } from 'hadron-react-components';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './collation-toolbar.module.less';

import { DEFAULT_MAX_TIME_MS } from '../../constants';

/**
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';
const HELP_URL_MAX_TIME_MS = 'https://www.mongodb.com/docs/manual/reference/method/cursor.maxTimeMS/';

/**
 * The collation toolbar component.
 */
class CollationToolbar extends PureComponent {
  static displayName = 'CollationToolbarComponent';

  static propTypes = {
    collation: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    collationChanged: PropTypes.func.isRequired,
    collationString: PropTypes.string,
    maxTimeMS: PropTypes.number,
    collationStringChanged: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    maxTimeMSChanged: PropTypes.func,
  };

  static defaultProps = { collation: {}, collationString: ''};

  state = { hasFocus: false };

  /**
   * Changes collation state.
   *
   * @param {Object} evt - Collation options.
   */
  onCollationChange = (evt) => {
    this.props.collationStringChanged(evt.target.value);
    this.props.collationChanged(evt.target.value);
  };

  onMaxTimeMsChanged = (evt) => {
    if (this.props.maxTimeMSChanged) {
      this.props.maxTimeMSChanged(parseInt(evt.currentTarget.value, 10));
    }
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
      <div
        data-testid="legacy-collation-toolbar"
        className={styles['collation-toolbar']}
      >
        <div
          onBlur={this._onBlur}
          onFocus={this._onFocus}
          className={classnames(
            styles['toolbar-input-wrapper'],
            { [ styles['has-focus'] ]: this.state.hasFocus }
          )}
        >
          <div
            className={classnames(
              styles['toolbar-input-label'],
              { [ styles['has-error'] ]: (this.props.collation === false) }
            )}
            data-testid="collation-toolbar-input-label">
            <InfoSprinkle helpLink={HELP_URL_COLLATION} onClickHandler={this.props.openLink} />
            Collation
          </div>
          <input
            data-testid="collation-string"
            placeholder="{ locale: 'simple' }"
            type="text"
            onChange={this.onCollationChange}
            value={this.props.collationString}
          />
          <div className={classnames(styles['max-time-ms'])}>
            <div
              className={classnames(styles['toolbar-input-label'])}
              data-testid="maxtimems-toolbar-input-label"
            >
              <InfoSprinkle
                helpLink={HELP_URL_MAX_TIME_MS}
                onClickHandler={this.props.openLink}
              />
              Max Time MS
            </div>
            <input
              data-testid="max-time-ms"
              id="max-time-limit"
              aria-describedby="max-time-limit"
              type="number"
              min="0"
              placeholder={DEFAULT_MAX_TIME_MS}
              value={this.props.maxTimeMS ?? ''}
              onChange={this.onMaxTimeMsChanged}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default CollationToolbar;
