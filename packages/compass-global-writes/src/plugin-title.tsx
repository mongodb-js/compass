import { connect } from 'react-redux';
import React from 'react';
import {
  type RootState,
  type ShardingStatus,
  ShardingStatuses,
} from './store/reducer';
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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('compassGlobalWrites');
  return (
    <Icon
      glyph="Warning"
      aria-label={t('warningIconLabel')}
      className={cx(
        warningIconStyles,
        warningIconStylesLight,
        darkMode && warningIconStylesDark
      )}
    />
  );
};

const WarningIcon = ({ darkMode }: { darkMode: boolean }) => {
  const { t } = useTranslation('compassGlobalWrites');
  return (
    <Icon
      glyph="ImportantWithCircle"
      aria-label={t('importantIconLabel')}
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
  const { t } = useTranslation('compassGlobalWrites');
  const darkMode = !!useDarkMode();
  return (
    <div data-testid="global-writes-tab-title" className={containerStyles}>
      {t('tabName')}{' '}
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
          <Body>{t('shardKeyTooltip')}</Body>
        </Tooltip>
      )}
    </div>
  );
};

export const GlobalWritesTabTitle = connect(({ status }: RootState) => {
  const errorStatuses: ShardingStatus[] = [
    ShardingStatuses.LOADING_ERROR,
    ShardingStatuses.SHARDING_ERROR,
    ShardingStatuses.SHARD_KEY_MISMATCH,
    ShardingStatuses.SHARD_KEY_INVALID,
  ];
  const okStatuses: ShardingStatus[] = [
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
