import { connect } from 'react-redux';
import React from 'react';
import { type RootState, ShardingStatuses } from './store/reducer';
import {
  css,
  Icon,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
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
        <Icon
          glyph="ImportantWithCircle"
          className={darkMode ? iconStylesDark : iconStylesLight}
        />
      )}
    </div>
  );
};

export const GlobalWritesTabTitle = connect(
  ({ isNamespaceSharded, status }: RootState) => ({
    showWarning: !isNamespaceSharded && status !== ShardingStatuses.NOT_READY,
  })
)(PluginTitle);
