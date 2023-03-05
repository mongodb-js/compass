import {
  Icon,
  IconButton,
  css,
  cx,
  spacing,
  palette,
  keyframes,
  SpinLoader,
  withDarkMode,
  useHotkeys,
} from '@mongodb-js/compass-components';
import React from 'react';
import PropTypes from 'prop-types';

const shellHeaderStyles = css({
  height: spacing[5],
  display: 'flex',
  color: palette.gray.light1,
});

const shellHeaderDarkModeStyles = css({
  borderTop: `1px solid ${palette.gray.dark2}`,
});

const shellHeaderLeftStyles = css({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
});

const shellHeaderDefaultColor = palette.gray.light1;
const shellHeaderFlashColorDark = palette.gray.base;
const shellHeaderFlashColorLight = palette.gray.light2;
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
    color: palette.gray.light3,
  },
});

const shellHeaderRightStyles = css({
  display: 'flex',
  paddingTop: spacing[1] / 2,
  paddingRight: spacing[2],
});

const infoButtonStyles = css({
  marginRight: spacing[2],
});

const operationInProgressStyles = css({
  color: palette.green.light2,
  marginLeft: spacing[2],
});

const inProgressSpinLoaderStyles = css({
  borderTopColor: palette.green.light2,
});

export const ShellHeader = ({
  darkMode,
  isExpanded,
  isOperationInProgress,
  onShellToggleClicked,
  showInfoModal,
}) => {
  useHotkeys('ctrl + `', onShellToggleClicked);

  return (
    <div
      className={cx(shellHeaderStyles, darkMode && shellHeaderDarkModeStyles)}
    >
      <div className={shellHeaderLeftStyles}>
        <button
          type="button"
          data-testid="shell-expand-button"
          className={shellHeaderToggleStyles}
          aria-label={isExpanded ? 'Close Shell' : 'Open Shell'}
          onClick={onShellToggleClicked}
          aria-pressed={isExpanded}
        >
          &gt;_MONGOSH
          {!isExpanded && isOperationInProgress && (
            <span className={operationInProgressStyles}>
              <SpinLoader size="12px" className={inProgressSpinLoaderStyles} />
              &nbsp;Command in progress&hellip;
            </span>
          )}
        </button>
      </div>
      <div className={shellHeaderRightStyles}>
        {isExpanded && (
          <IconButton
            data-testid="shell-info-button"
            className={infoButtonStyles}
            variant="dark"
            aria-label="Shell Info"
            aria-haspopup="dialog"
            onClick={showInfoModal}
          >
            <Icon glyph="InfoWithCircle" size="small" />
          </IconButton>
        )}
        <IconButton
          variant="dark"
          aria-label={isExpanded ? 'Close Shell' : 'Open Shell'}
          onClick={onShellToggleClicked}
          aria-pressed={isExpanded}
        >
          <Icon glyph={isExpanded ? 'ChevronDown' : 'ChevronUp'} size="small" />
        </IconButton>
      </div>
    </div>
  );
};

ShellHeader.propTypes = {
  darkMode: PropTypes.bool,
  isExpanded: PropTypes.bool.isRequired,
  isOperationInProgress: PropTypes.bool.isRequired,
  onShellToggleClicked: PropTypes.func.isRequired,
  showInfoModal: PropTypes.func.isRequired,
};

export default withDarkMode(ShellHeader);
