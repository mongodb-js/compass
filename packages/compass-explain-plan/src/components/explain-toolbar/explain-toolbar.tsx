import type AppRegistry from 'hadron-app-registry';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SegmentedControl,
  SegmentedControlOption,
  Overline,
  Toolbar,
  css,
  spacing,
  withTheme,
} from '@mongodb-js/compass-components';
import { useId } from '@react-aria/utils';

const ExplainToolbarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[3],
  padding: spacing[3],
  boxShadow: '0 2px 2px rgb(0 0 0 / 20%)',
  zIndex: 10,
});

const ExplainQueryBarStyles = css({
  width: '100%',
  position: 'relative',
});

const ExplainActionsToolbarStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
  gap: spacing[2],
});

type ExplainToolbarProps = {
  localAppRegistry: AppRegistry;
  darkMode?: boolean;
  explainResultId: string;
  onExecuteExplainClicked: (queryBarStoreState: any) => void;
  switchToTreeView: () => void;
  switchToJSONView: () => void;
  viewType: 'json' | 'tree';
};

function UnthemedExplainToolbar({
  localAppRegistry,
  darkMode,
  explainResultId,
  onExecuteExplainClicked,
  switchToTreeView,
  switchToJSONView,
  viewType,
}: ExplainToolbarProps) {
  const labelId = useId();
  const controlId = useId();

  const queryBarRef = useRef<{
    component: React.ComponentType<any>;
    store: any; // Query bar store is not currently typed.
    actions: any; // Query bar actions are not typed.
  } | null>(null);

  const [queryBarLoaded, setQueryBarLoaded] = useState(false);

  // TODO: Move query bar up a level so it's usable by other things
  // but stays in state.
  // Maybe just have this component in explain states, but break
  // out the segmented control.

  useEffect(() => {
    const queryBarRole = localAppRegistry.getRole('Query.QueryBar')![0];

    queryBarRef.current = {
      component: queryBarRole.component,
      store: localAppRegistry.getStore(queryBarRole.storeName),
      actions: localAppRegistry.getAction(queryBarRole.actionName),
    };

    setQueryBarLoaded(true);
  }, []);

  const toggleView = useCallback(() => {
    if (viewType === 'json') {
      switchToTreeView();
    } else {
      switchToJSONView();
    }
  }, [viewType]);

  const onExecuteExplainClickedCallback = useCallback(() => {
    onExecuteExplainClicked(queryBarRef.current!.store.state);
  }, [onExecuteExplainClicked]);

  const QueryBarComponent = queryBarLoaded
    ? queryBarRef.current!.component
    : null;

  return (
    <Toolbar className={ExplainToolbarStyles}>
      <div className={ExplainQueryBarStyles}>
        {queryBarLoaded && QueryBarComponent && (
          <QueryBarComponent
            store={queryBarRef.current!.store}
            actions={queryBarRef.current!.actions}
            buttonLabel="Explain"
            resultId={explainResultId}
            onApply={onExecuteExplainClickedCallback}
            onReset={onExecuteExplainClickedCallback}
          />
        )}
      </div>
      <div className={ExplainActionsToolbarStyles}>
        <Overline
          as="label"
          id={labelId}
          htmlFor={controlId}
          aria-label="Show explain as"
        >
          View
        </Overline>
        <SegmentedControl
          darkMode={darkMode}
          id={controlId}
          aria-labelledby={labelId}
          size="small"
          value={viewType}
          onChange={toggleView}
        >
          <SegmentedControlOption aria-label="Visual Tree View" value="tree">
            Visual Tree
          </SegmentedControlOption>
          <SegmentedControlOption aria-label="Raw Json View" value="json">
            Raw Json
          </SegmentedControlOption>
        </SegmentedControl>
      </div>
    </Toolbar>
  );
}

const ExplainToolbar = withTheme(UnthemedExplainToolbar);

export { ExplainToolbar };
