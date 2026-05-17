import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import { connect } from '../../../stores/context';
import {
  addProjectionEntry,
  removeProjectionEntry,
  toggleProjectionMode,
} from '../../../stores/query-bar-reducer';
import type {
  QueryBarThunkDispatch,
  RootState,
} from '../../../stores/query-bar-store';
import type {
  ProjectionEntry,
  ValueDragPayload,
} from '../../../utils/visual-builder-serialize';
import { DropZone } from '../drop-zone';
import { ProjectionRow } from './projection-row';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

type Props = {
  entries: ProjectionEntry[];
  onToggleMode: (id: string) => void;
  onRemove: (id: string) => void;
  onValueDrop?: (payload: ValueDragPayload) => void;
};

function ProjectionZone({
  entries,
  onToggleMode,
  onRemove,
  onValueDrop,
}: Props) {
  return (
    <div
      className={containerStyles}
      data-testid="visual-query-builder-projection"
    >
      <DropZone
        id="zone-projection"
        isEmpty={entries.length === 0}
        emptyMessage="Drag and drop fields here or double-click"
        onValueDrop={onValueDrop}
      >
        {entries.map((entry) => (
          <ProjectionRow
            key={entry.id}
            entry={entry}
            onToggleMode={() => onToggleMode(entry.id)}
            onRemove={() => onRemove(entry.id)}
          />
        ))}
      </DropZone>
    </div>
  );
}

export default connect(
  (state: RootState) => ({
    entries: state.queryBar.visualBuilder.projection,
  }),
  (dispatch: QueryBarThunkDispatch) => ({
    onToggleMode: (id: string) => dispatch(toggleProjectionMode(id)),
    onRemove: (id: string) => dispatch(removeProjectionEntry(id)),
    onValueDrop: (payload: ValueDragPayload) =>
      dispatch(addProjectionEntry({ path: payload.path })),
  })
)(ProjectionZone);
