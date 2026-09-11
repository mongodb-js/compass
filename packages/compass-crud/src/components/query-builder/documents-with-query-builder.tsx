import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Icon,
  IconButton,
  ResizeDirection,
  ResizeHandle,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import DocumentList from '../document-list';
import type { DocumentListProps } from '../document-list';
import { QueryBuilderPanel } from './query-builder-panel';
import type { BuilderState } from './builder-query';
import {
  EMPTY_BUILDER_STATE,
  compileBuilderState,
  compiledQueryToAppliedQuery,
} from './builder-query';
import {
  MAX_BUILDER_WIDTH,
  MIN_BUILDER_WIDTH,
  mirrorBuilderWidth,
} from './builder-panel-size';
import { useTabState } from '@mongodb-js/compass-workspaces/provider';

const DEFAULT_BUILDER_WIDTH = 460;

const layout = css({
  display: 'flex',
  width: '100%',
  height: '100%',
  minHeight: 0,
});

const resultsPane = css({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  // Anchors the resize handle, which positions itself on the right edge.
  position: 'relative',
});

const builderPane = css({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  borderLeft: `1px solid ${palette.gray.light2}`,
  backgroundColor: palette.gray.light3,
});

const builderPaneDark = css({
  borderLeftColor: palette.gray.dark2,
  backgroundColor: palette.black,
});

const builderHeader = css({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: `${spacing[100]}px ${spacing[100]}px 0`,
});

const builderScroll = css({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
});

const collapsedStrip = css({
  flex: 'none',
  display: 'flex',
  justifyContent: 'center',
  padding: spacing[100],
  borderLeft: `1px solid ${palette.gray.light2}`,
});

const collapsedStripDark = css({
  borderLeftColor: palette.gray.dark2,
});

/**
 * The documents view with a visual query builder beside it.
 *
 * The builder is a panel on the right of the document results. Fields dragged
 * out of a document land in it, and it is collapsed until asked for, so the
 * documents view is unchanged for anyone not using it.
 *
 * The builder owns its rows and compiles them into a query. The query bar at
 * the top of the tab is where that query is shown: editing a row writes the
 * filter, projection, sort, skip and limit into the query bar inputs, and
 * running applies them from there. So the query the builder describes is the
 * same query, in the same boxes, as one typed by hand.
 */
export const DocumentsWithQueryBuilder: React.FunctionComponent<DocumentListProps> = (
  props
) => {
  const darkMode = useDarkMode();
  const { store } = props;
  // Per workspace tab, and surviving the unmount that switching tabs causes.
  // Two tabs on the same collection are two different queries, so this is
  // scoped to the tab rather than to the collection.
  const [builderState, setBuilderState] = useTabState<BuilderState>(
    'query-builder-rows',
    EMPTY_BUILDER_STATE
  );
  const [builderWidth, setBuilderWidth] = useTabState(
    'query-builder-width',
    DEFAULT_BUILDER_WIDTH
  );
  // Collapsed until asked for: this is the documents view, and it should look
  // and behave exactly as it always has for anyone not using the builder. Once
  // opened in a tab it stays open for that tab.
  const [isCollapsed, setIsCollapsed] = useTabState(
    'query-builder-collapsed',
    true
  );

  const compiled = useMemo(
    () => compileBuilderState(builderState),
    [builderState]
  );

  const builderHasRows =
    builderState.conditions.length > 0 ||
    builderState.projections.length > 0 ||
    builderState.sorts.length > 0 ||
    builderState.skip.trim() !== '' ||
    builderState.limit.trim() !== '';

  // Keep the query bar showing what the rows describe, without running it.
  //
  // Only while the panel is open and actually has rows. An empty builder must
  // not write to the bar, or opening the panel would wipe a query typed by
  // hand. Once there are rows the builder owns the query, and editing a row
  // replaces whatever is in the bar.
  useEffect(() => {
    if (isCollapsed || !builderHasRows) {
      return;
    }
    store.queryBar.setQuery(compiledQueryToAppliedQuery(compiled));
  }, [compiled, store, isCollapsed, builderHasRows]);

  const onRun = useCallback(() => {
    // Every property is sent on every run, using undefined for the ones the
    // builder has no rows for. Leaving a property out of the query instead
    // leaves the previously applied value in place, so removing the last
    // projection row would not actually remove the projection.
    store.queryBar.setAndApplyQuery(
      compiledQueryToAppliedQuery(compiled),
      'crud'
    );
    void store.refreshDocuments(true);
  }, [compiled, store]);

  // The handle works in mirrored width, so that its own clamping points the
  // same way the pointer does. See mirrorBuilderWidth for why.
  const onResize = useCallback((nextValue: number) => {
    setBuilderWidth(mirrorBuilderWidth(nextValue));
  }, []);

  return (
    <div className={layout} data-testid="documents-with-query-builder">
      <div className={resultsPane}>
        <DocumentList {...props} />
        {!isCollapsed && (
          <ResizeHandle
            direction={ResizeDirection.RIGHT}
            value={mirrorBuilderWidth(builderWidth)}
            minValue={MIN_BUILDER_WIDTH}
            maxValue={MAX_BUILDER_WIDTH}
            onChange={onResize}
            title="query builder"
          />
        )}
      </div>

      {isCollapsed ? (
        <div
          className={cx(collapsedStrip, darkMode && collapsedStripDark)}
          data-testid="query-builder-collapsed"
        >
          <IconButton
            aria-label="Show query builder"
            title="Show query builder"
            onClick={() => setIsCollapsed(false)}
          >
            <Icon glyph="ChevronLeft" />
          </IconButton>
        </div>
      ) : (
        <aside
          className={cx(builderPane, darkMode && builderPaneDark)}
          style={{ width: builderWidth }}
          data-testid="query-builder-pane"
        >
          <div className={builderHeader}>
            <IconButton
              aria-label="Hide query builder"
              title="Hide query builder"
              onClick={() => setIsCollapsed(true)}
            >
              <Icon glyph="ChevronRight" />
            </IconButton>
          </div>
          <div className={builderScroll}>
            <QueryBuilderPanel
              state={builderState}
              onChange={setBuilderState}
              onRun={onRun}
              errors={compiled.errors}
            />
          </div>
        </aside>
      )}
    </div>
  );
};

export default DocumentsWithQueryBuilder;
