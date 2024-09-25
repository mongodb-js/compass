import { connect } from 'react-redux';
import React from 'react';
import { type RootState, ShardingStatuses } from './store/reducer';
import { Icon } from '@mongodb-js/compass-components';

const PluginTitle = ({ showWarning }: { showWarning: boolean }) => {
  return (
    <div data-testid="global-writes-tab-title">
      Global Writes {showWarning && <Icon glyph="ImportantWithCircle" />}
    </div>
  );
};

export const GlobalWritesTabTitle = connect(
  ({ isNamespaceSharded, status }: RootState) => ({
    showWarning: !isNamespaceSharded && status !== ShardingStatuses.NOT_READY,
  })
)(PluginTitle);
