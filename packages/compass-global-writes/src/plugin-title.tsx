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

const iconStylesLight = css({
  color: palette.yellow.dark2,
});

const iconStylesDark = css({
  color: palette.yellow.base,
});

const PluginTitle = ({ showWarning }: { showWarning: boolean }) => {
  const darkMode = useDarkMode();
  return (
    <div data-testid="global-writes-tab-title" className={containerStyles}>
      Global Writes{' '}
      {showWarning && (
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
              <Icon
                glyph="ImportantWithCircle"
                className={cx(
                  warningIconStyles,
                  iconStylesLight,
                  darkMode && iconStylesDark
                )}
              />
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

export const GlobalWritesTabTitle = connect(
  ({ managedNamespace, status }: RootState) => ({
    showWarning: !managedNamespace && status !== ShardingStatuses.NOT_READY,
  })
)(PluginTitle);
