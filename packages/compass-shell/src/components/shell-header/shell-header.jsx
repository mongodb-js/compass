import { Icon, IconButton, css, spacing, uiColors, keyframes } from '@mongodb-js/compass-components';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { ShellLoader } from '@mongosh/browser-repl';

const shellHeaderStyles = css({
  height: spacing[5],
  display: 'flex',
  color: uiColors.gray.light1
});

const shellHeaderLeftStyles = css({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center'
});


const shellHeaderDefaultColor = uiColors.gray.light1;
const shellHeaderFlashColorDark = uiColors.gray.base;
const shellHeaderFlashColorLight = uiColors.gray.light2;
const shellLoaderFlash = keyframes`
  0% { color: ${shellHeaderDefaultColor}; }
  10% { color: ${shellHeaderFlashColorDark}; }
  20% { color: ${shellHeaderFlashColorLight}; }
  30% { color: ${shellHeaderFlashColorDark}; }
  40% { color: ${shellHeaderFlashColorLight}; }
  50% { color: ${shellHeaderFlashColorDark}; }
  60% { color: ${shellHeaderFlashColorLight}; }
  70% { color: ${shellHeaderFlashColorDark}; }
  80% { color: ${shellHeaderFlashColorLight}; }
  100% { color: ${shellHeaderDefaultColor}; }
`;

const shellHeaderToggleStyles = css({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: shellHeaderDefaultColor,
  padding: `0px ${spacing[2]}px`,
  height: '100%',
  display: 'flex',
  verticalAlign: 'middle',
  flexDirection: 'row',
  alignItems: 'center',
  margin: 'auto 0',
  fontWeight: 'bold',
  fontSize: spacing[2] * 1.5,
  lineHeight: `${spacing[5]}px`,
  transition: 'all 200ms',
  userSelect: 'none',
  textTransform: 'uppercase',
  animation: `${shellLoaderFlash} 2s linear`,
  '&:hover': {
    color: uiColors.gray.light3
  }
});


const shellHeaderRightStyles = css({
  display: 'flex',
  paddingTop: spacing[1] / 2,
  paddingRight: spacing[2]
});

const infoButtonStyles = css({
  marginRight: spacing[2]
});

const operationInProgressStyles = css({
  color: uiColors.green.light2,
  marginLeft: spacing[2]
});

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
      <div className={shellHeaderStyles}>
        <div className={shellHeaderLeftStyles}>
          <button
            data-test-id="shell-expand-button"
            className={shellHeaderToggleStyles}
            aria-label={isExpanded ? 'Close Shell' : 'Open Shell'}
            onClick={onShellToggleClicked}
            aria-pressed={isExpanded}
          >
            &gt;_MONGOSH
            {!isExpanded && isOperationInProgress && (
              <span className={operationInProgressStyles}>
                <ShellLoader
                  size="12px"
                />&nbsp;Command in progress&hellip;
              </span>
            )}
          </button>
        </div>
        <div className={shellHeaderRightStyles}>
          {isExpanded && (
            <IconButton
              className={infoButtonStyles}
              variant="dark"
              aria-label="Shell Info"
              aria-haspopup="dialog"
              onClick={showInfoModal}
            >
              <Icon
                glyph="InfoWithCircle"
                size="small"
              />
            </IconButton>
          )}
          <IconButton
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
