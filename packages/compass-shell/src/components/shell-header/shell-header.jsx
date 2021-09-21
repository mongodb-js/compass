import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ShellLoader } from '@mongosh/browser-repl';

import { SET_SHOW_INFO_MODAL } from '../../modules/info-modal';

import styles from './shell-header.module.less';

export class ShellHeader extends Component {
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    isOperationInProgress: PropTypes.bool.isRequired,
    onShellToggleClicked: PropTypes.func.isRequired,
    showInfoModal: PropTypes.func.isRequired
  };

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
                  data-test-id="shell-loader-in-progress"
                  name="shell-loader-in-progress-text"
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

export default connect(
  null,
  (dispatch) => ({
    showInfoModal: () => dispatch({
      type: SET_SHOW_INFO_MODAL,
      isInfoModalVisible: true
    })
  })
)(ShellHeader);
