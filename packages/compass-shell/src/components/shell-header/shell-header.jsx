import { IconButton } from '@mongodb-js/compass-components';
import { Icon } from '@mongodb-js/compass-components';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { ShellLoader } from '@mongosh/browser-repl';

import styles from './shell-header.module.less';

export class ShellHeader extends Component {
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    isOperationInProgress: PropTypes.bool.isRequired,
    onShellToggleClicked: PropTypes.func.isRequired,
    showInfoModal: PropTypes.func.isRequired
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyboardToggle.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyboardToggle.bind(this));
  }

  handleKeyboardToggle({ ctrlKey, key }) {
    if (ctrlKey && key === '`') {
      this.props.onShellToggleClicked();
    }
  }

  /**
   * Render ShellHeader component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const {
      isExpanded,
      isOperationInProgress,
      onShellToggleClicked,
      showInfoModal
    } = this.props;

    return (
      <div className={styles['compass-shell-header']}>
        <div className={styles['compass-shell-header-left']}>
          <button
            data-test-id="shell-expand-button"
            className={styles['compass-shell-header-toggle']}
            aria-label={isExpanded ? 'Close Shell' : 'Open Shell'}
            onClick={onShellToggleClicked}
            aria-pressed={isExpanded}
          >
            &gt;_MONGOSH
            {!isExpanded && isOperationInProgress && (
              <>
                <ShellLoader
                  className={styles['compass-shell-header-loader-icon']}
                  size="12px"
                />
                <span
                  className={styles['compass-shell-header-operation-in-progress']}
                >Command in progress...</span>
              </>
            )}
          </button>
        </div>
        <div className={styles['compass-shell-header-right-actions']}>
          {isExpanded &&
              <IconButton
                className={styles['compass-shell-header-btn']}
                variant="dark"
                aria-label="Shell Info"
                aria-haspopup="dialog"
                onClick={showInfoModal}
              >
                <Icon
                  glyph="InfoWithCircle"
                  size="small"
                />
              </IconButton>}
          <IconButton
            className={styles['compass-shell-header-btn']}
            variant="dark"
            aria-label={isExpanded ? 'Close Shell' : 'Open Shell'}
            onClick={onShellToggleClicked}
            aria-pressed={isExpanded}
          >
            <Icon
              glyph={isExpanded ? 'ChevronDown' : 'ChevronUp'}
              size="small"
            />
          </IconButton>
        </div>
      </div>
    );
  }
}

export default ShellHeader;
