// import { connect } from 'react-redux';
import React from 'react';
// import { type RootState } from './store/reducer';
import { css, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
});

export const PluginTitle = () => {
  return (
    <div data-testid="schema-viz-tab-title" className={containerStyles}>
      Schema Vizualization
    </div>
  );
};

// export const SchemaVizualizationTabTitle = connect(({ .. }: RootState) => {
//
// })(PluginTitle);
