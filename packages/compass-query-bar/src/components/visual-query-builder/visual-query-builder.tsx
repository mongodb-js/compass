import React, { useCallback, useMemo, useState } from 'react';
import {
  Body,
  Button,
  KeylineCard,
  Label,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { FieldChip } from './draggable-field';
import { connect } from '../../stores/context';
import {
  addFilterRule,
  addProjectionEntry,
  addSortEntry,
  applyVisualBuilder,
  clearVisualBuilder,
  reorderSort,
  toggleVisualBuilder,
} from '../../stores/query-bar-reducer';
import type {
  QueryBarThunkDispatch,
  RootState,
} from '../../stores/query-bar-store';
import { FieldsSidebar } from './fields-sidebar';
import FilterZone from './filter-zone/filter-zone';
import ProjectionZone from './projection-zone/projection-zone';
import SortZone from './sort-zone/sort-zone';
import { UnrepresentableOverlay } from './unrepresentable-overlay';

const panelStyles = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[400],
  padding: spacing[200],
  marginBottom: spacing[200],
});

const zonesStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
  flexGrow: 1,
  minWidth: 0,
});

const zoneSectionStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const zoneHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[200],
  background: palette.red.light3,
  padding: `${spacing[100]}px ${spacing[200]}px`,
  borderRadius: '4px',
});

const zoneHeaderDarkStyles = css({
  background: palette.gray.dark3,
});

const actionsStyles = css({
  display: 'flex',
  gap: spacing[100],
});

type DropTargetZone = 'filter' | 'projection' | 'sort';

type OwnProps = {
  /**
   * The host plugin's apply handler — the same callback the regular Find button
   * uses (defined in `query-bar.tsx` mapDispatchToProps). Calling it dispatches
   * `applyQuery(source)` AND invokes the host's `onApply` prop (e.g.
   * `store.refreshDocuments(true)` in compass-crud), which is what actually
   * makes the grid re-fetch and dismisses the "outdated" banner.
   */
  onRunQuery: () => void;
};

type Props = OwnProps & {
  namespace: string;
  representable: boolean;
  onAddFilterField: (path: string, type: string) => void;
  onAddProjectionField: (path: string) => void;
  onAddSortField: (path: string) => void;
  onReorderSort: (activeId: string, overId: string) => void;
  onClear: () => void;
  onApply: () => void;
  onClose: () => void;
};

function VisualQueryBuilder({
  namespace,
  representable,
  onAddFilterField,
  onAddProjectionField,
  onAddSortField,
  onReorderSort,
  onClear,
  onApply,
  onClose,
}: Props) {
  const darkMode = useDarkMode();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );
  const [activeField, setActiveField] = useState<{
    path: string;
    type: string;
  } | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as
      | { kind?: string; path?: string; type?: string }
      | undefined;
    if (data?.kind === 'field' && data.path) {
      setActiveField({ path: data.path, type: data.type ?? '' });
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveField(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveField(null);
      const { active, over } = event;
      if (!over) return;
      const activeData = active.data.current as
        | { kind: string; path?: string; type?: string }
        | undefined;
      const overData = over.data.current as
        | { kind?: string; zone?: DropTargetZone }
        | undefined;

      if (activeData?.kind === 'field' && overData?.kind === 'zone') {
        if (overData.zone === 'filter') {
          onAddFilterField(activeData.path ?? '', activeData.type ?? '');
        } else if (overData.zone === 'projection') {
          onAddProjectionField(activeData.path ?? '');
        } else if (overData.zone === 'sort') {
          onAddSortField(activeData.path ?? '');
        }
        return;
      }

      if (activeData?.kind === 'sort-entry' && active.id !== over.id) {
        onReorderSort(String(active.id), String(over.id));
      }
    },
    [onAddFilterField, onAddProjectionField, onAddSortField, onReorderSort]
  );

  const handleAddFieldFromSidebar = useCallback(
    (path: string, type: string) => {
      // Double-click adds to the filter zone by default (mirrors Studio 3T).
      onAddFilterField(path, type);
    },
    [onAddFilterField]
  );

  const headerCx = useMemo(
    () => cx(zoneHeaderStyles, darkMode && zoneHeaderDarkStyles),
    [darkMode]
  );

  return (
    <KeylineCard data-testid="visual-query-builder" className={panelStyles}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <FieldsSidebar
          namespace={namespace}
          onAddField={handleAddFieldFromSidebar}
        />

        <div className={zonesStyles}>
          <div className={zoneSectionStyles}>
            <div className={headerCx}>
              <Label htmlFor="visual-query-builder-filter">Query</Label>
              <div className={actionsStyles}>
                <Button size="xsmall" onClick={onClear}>
                  Clear
                </Button>
                <Button size="xsmall" variant="primary" onClick={onApply}>
                  Run
                </Button>
                <Button size="xsmall" onClick={onClose}>
                  Hide
                </Button>
              </div>
            </div>
            <FilterZone />
          </div>

          <div className={zoneSectionStyles}>
            <div className={headerCx}>
              <Label htmlFor="visual-query-builder-projection">
                Projection
              </Label>
            </div>
            <ProjectionZone />
          </div>

          <div className={zoneSectionStyles}>
            <div className={headerCx}>
              <Label htmlFor="visual-query-builder-sort">Sort</Label>
            </div>
            <SortZone />
          </div>

          {!representable && (
            <Body data-testid="visual-query-builder-banner">
              The current filter / projection / sort can&apos;t be represented
              visually.
            </Body>
          )}
        </div>

        {!representable && <UnrepresentableOverlay onClear={onClear} />}

        <DragOverlay dropAnimation={null}>
          {activeField ? (
            <div data-testid="visual-query-builder-drag-overlay">
              <FieldChip
                path={activeField.path}
                type={activeField.type}
                forOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </KeylineCard>
  );
}

export default connect(
  (state: RootState) => ({
    namespace: state.queryBar.namespace,
    representable: state.queryBar.visualBuilder.representable,
  }),
  (dispatch: QueryBarThunkDispatch, ownProps: OwnProps) => ({
    onAddFilterField: (path: string, type: string) =>
      dispatch(addFilterRule({ path, bsonType: type })),
    onAddProjectionField: (path: string) =>
      dispatch(addProjectionEntry({ path })),
    onAddSortField: (path: string) => dispatch(addSortEntry({ path })),
    onReorderSort: (activeId: string, overId: string) =>
      dispatch(reorderSort(activeId, overId)),
    onClear: () => dispatch(clearVisualBuilder()),
    onApply: () => {
      // Fire the dedicated 'Visual Query Builder Applied' telemetry first…
      dispatch(applyVisualBuilder());
      // …then trigger the same apply path Find uses (redux applyQuery +
      // host's onApply callback → refreshDocuments).
      ownProps.onRunQuery();
    },
    onClose: () => dispatch(toggleVisualBuilder(false)),
  })
)(VisualQueryBuilder);
