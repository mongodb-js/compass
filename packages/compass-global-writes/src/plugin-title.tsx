import { connect } from 'react-redux';
import React from 'react';
import { type RootState, ShardingStatuses } from './store/reducer';
import {
  Body,
  css,
  cx,
  Icon,
  palette,
  spacing,
  Tooltip,
  useDarkMode,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
});

const warningIconStyles = css({
  display: 'flex',
});

const warningIconStylesLight = css({
  color: palette.red.dark2,
});

const warningIconStylesDark = css({
  color: palette.red.base,
});

const importantIconStylesLight = css({
  color: palette.yellow.dark2,
});

const importantIconStylesDark = css({
  color: palette.yellow.base,
});

const ErrorIcon = ({ darkMode }: { darkMode: boolean }) => {
  return (
    <Icon
      glyph="Warning"
      aria-label="warning"
      className={cx(
        warningIconStyles,
        warningIconStylesLight,
        darkMode && warningIconStylesDark
      )}
    />
  );
};

const WarningIcon = ({ darkMode }: { darkMode: boolean }) => {
  return (
    <Icon
      glyph="ImportantWithCircle"
      aria-label="important"
      className={cx(
        warningIconStyles,
        importantIconStylesLight,
        darkMode && importantIconStylesDark
      )}
    />
  );
};

export const PluginTitle = ({
  showError,
  showWarning,
}: {
  showError: boolean;
  showWarning: boolean;
}) => {
  const darkMode = !!useDarkMode();
  return (
    <div data-testid="global-writes-tab-title" className={containerStyles}>
      Global Writes{' '}
      {(showError || showWarning) && (
        <Tooltip
          data-testid="collection-stats-tooltip"
          align="bottom"
          justify="middle"
          trigger={
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <span
              onClick={() => {
                // LG does not bubble up the click event to the parent component,
                // so we add noop onClick and let it bubble up.
              }}
            >
              {showError ? (
                <ErrorIcon darkMode={darkMode} />
              ) : (
                <WarningIcon darkMode={darkMode} />
              )}
            </span>
          }
        >
          <Body>
            Collections in Atlas Global Clusters with Atlas-managed sharding
            must be configured with a compound shard key made up of both a
            &apos;location&apos; field and an identifier field that you provide.
            Please configure sharding here.
          </Body>
        </Tooltip>
      )}
    </div>
  );
};

export const GlobalWritesTabTitle = connect(({ status }: RootState) => {
  const errorStatuses = [
    ShardingStatuses.LOADING_ERROR,
    ShardingStatuses.SHARDING_ERROR,
    ShardingStatuses.SHARD_KEY_MISMATCH,
    ShardingStatuses.SHARD_KEY_INVALID,
  ];
  const okStatuses = [
    ShardingStatuses.NOT_READY,
    ShardingStatuses.SHARD_KEY_CORRECT,
  ];
  const showError = errorStatuses.includes(status);
  const showWarning = !showError && !okStatuses.includes(status);

  return {
    showError,
    showWarning,
  };
})(PluginTitle);
