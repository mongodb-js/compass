import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { connect } from '../../../stores/context';
import {
  addSortEntry,
  removeSortEntry,
  toggleSortDirection,
} from '../../../stores/query-bar-reducer';
import type {
  QueryBarThunkDispatch,
  RootState,
} from '../../../stores/query-bar-store';
import type {
  SortEntry,
  ValueDragPayload,
} from '../../../utils/visual-builder-serialize';
import { DropZone } from '../drop-zone';
import { SortRow } from './sort-row';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

type Props = {
  entries: SortEntry[];
  onToggleDirection: (id: string) => void;
  onRemove: (id: string) => void;
  onValueDrop?: (payload: ValueDragPayload) => void;
};

function SortZone({
  entries,
  onToggleDirection,
  onRemove,
  onValueDrop,
}: Props) {
  return (
    <div className={containerStyles} data-testid="visual-query-builder-sort">
      <DropZone
        id="zone-sort"
        isEmpty={entries.length === 0}
        emptyMessage="Drag and drop fields here or double-click"
        onValueDrop={onValueDrop}
      >
        <SortableContext
          items={entries.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {entries.map((entry) => (
            <SortRow
              key={entry.id}
              entry={entry}
              onToggleDirection={() => onToggleDirection(entry.id)}
              onRemove={() => onRemove(entry.id)}
            />
          ))}
        </SortableContext>
      </DropZone>
    </div>
  );
}

export default connect(
  (state: RootState) => ({
    entries: state.queryBar.visualBuilder.sort,
  }),
  (dispatch: QueryBarThunkDispatch) => ({
    onToggleDirection: (id: string) => dispatch(toggleSortDirection(id)),
    onRemove: (id: string) => dispatch(removeSortEntry(id)),
    onValueDrop: (payload: ValueDragPayload) =>
      dispatch(addSortEntry({ path: payload.path })),
  })
)(SortZone);
