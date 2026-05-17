import React from 'react';
import { Button, Icon } from '@mongodb-js/compass-components';
import { connect } from '../../stores/context';
import { toggleVisualBuilder } from '../../stores/query-bar-reducer';
import type {
  QueryBarThunkDispatch,
  RootState,
} from '../../stores/query-bar-store';

type Props = {
  isVisible: boolean;
  onToggle: () => void;
};

function VisualQueryBuilderToggle({ isVisible, onToggle }: Props) {
  return (
    <Button
      type="button"
      size="small"
      aria-label="Visual Query Builder"
      title="Visual Query Builder"
      aria-pressed={isVisible}
      data-testid="visual-query-builder-toggle"
      leftGlyph={<Icon glyph="Filter" />}
      onClick={onToggle}
    >
      Visual
    </Button>
  );
}

export default connect(
  (state: RootState) => ({
    isVisible: state.queryBar.visualBuilder.isVisible,
  }),
  (dispatch: QueryBarThunkDispatch) => ({
    onToggle: () => dispatch(toggleVisualBuilder()),
  })
)(VisualQueryBuilderToggle);
