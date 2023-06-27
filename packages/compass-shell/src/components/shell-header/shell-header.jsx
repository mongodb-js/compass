import {
  Icon,
  IconButton,
  css,
  cx,
  spacing,
  palette,
  SpinLoader,
  withDarkMode,
  useHotkeys,
  GuideCue,
  Link,
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
  '&:hover': {
    color: palette.gray.light3,
  },
});

const shellHeaderRightStyles = css({
  display: 'flex',
  paddingTop: spacing[1] / 2,
  paddingRight: spacing[2],
  gap: spacing[2],
});

const operationInProgressStyles = css({
  color: palette.green.light2,
  marginLeft: spacing[2],
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
          <GuideCue
            cueId="shell-title"
            title="Using the embedded MongoDB Shell"
            description={
              <>
                Compass includes an embedded mongosh, allowing you to test
                queries and operations in your databases.
                <Link
                  href="https://www.mongodb.com/docs/compass/beta/embedded-shell/#embedded-mongodb-shell"
                  hideExternalIcon
                >
                  Learn more about running operations in mongosh.
                </Link>
              </>
            }
            trigger={({ ref }) => <span ref={ref}>&gt;_MONGOSH</span>}
          />
          {!isExpanded && isOperationInProgress && (
            <span className={operationInProgressStyles}>
              <SpinLoader darkMode={true} />
              &nbsp;Command in progress&hellip;
            </span>
          )}
        </button>
      </div>
      <div className={shellHeaderRightStyles}>
        {isExpanded && (
          <GuideCue
            cueId="shell-info"
            title="Using the embedded MongoDB Shell"
            description={
              'When expanded, mongosh enables you to run commands on your data. Click on the info icon to learn more about the keyboard shortcuts available to you when using mongosh.'
            }
            trigger={({ ref }) => (
              <IconButton
                ref={ref}
                data-testid="shell-info-button"
                variant="dark"
                aria-label="Shell Info"
                aria-haspopup="dialog"
                onClick={showInfoModal}
              >
                <Icon glyph="InfoWithCircle" size="small" />
              </IconButton>
            )}
          />
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
