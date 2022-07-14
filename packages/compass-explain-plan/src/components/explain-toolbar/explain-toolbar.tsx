import type AppRegistry from 'hadron-app-registry';

import React, { useCallback, useRef } from 'react';
import {
  Button,
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  Overline,
  Toolbar,
  css,
  spacing,
  useId,
  withTheme,
  WarningSummary,
  ErrorSummary,
} from '@mongodb-js/compass-components';

const explainToolbarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[3],
  padding: spacing[3],
  boxShadow: '0 2px 2px rgb(0 0 0 / 20%)',
  zIndex: 10,
});

const explainQueryBarStyles = css({
  width: '100%',
  position: 'relative',
});

const explainActionsToolbarStyles = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
});

const explainActionsToolbarRightStyles = css({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[2],
});

const READ_ONLY_WARNING_MESSAGE =
  'Explain plans on readonly views are not supported.';
const OUTDATED_WARNING_MESSAGE = `The explain content is outdated and no longer in sync
 with the documents view. Press "Explain" again to see the explain plan for
 the current query.`;

type ExplainView = 'json' | 'tree';

type ExplainToolbarProps = {
  localAppRegistry: AppRegistry;
  darkMode?: boolean;
  explainErrorMessage?: string;
  explainResultId: string;
  onExecuteExplainClicked: (queryBarStoreState: any) => void;
  onExportToLanguageClicked: () => void;
  showOutdatedWarning: boolean;
  showReadonlyWarning: boolean;
  switchToTreeView: () => void;
  switchToJSONView: () => void;
  viewType: ExplainView;
};

function UnthemedExplainToolbar({
  localAppRegistry,
  darkMode,
  explainResultId,
  explainErrorMessage,
  onExecuteExplainClicked,
  onExportToLanguageClicked,
  showOutdatedWarning,
  showReadonlyWarning,
  switchToTreeView,
  switchToJSONView,
  viewType,
}: ExplainToolbarProps) {
  const labelId = useId();
  const controlId = useId();

  const queryBarRole = localAppRegistry.getRole('Query.QueryBar')![0];

  const queryBarRef = useRef<{
    component: React.ComponentType<any>;
    store: any; // Query bar store is not currently typed.
    actions: any; // Query bar actions are not typed.
  }>({
    component: queryBarRole.component,
    store: localAppRegistry.getStore(queryBarRole.storeName!),
    actions: localAppRegistry.getAction(queryBarRole.actionName!),
  });

  const toggleView = useCallback(
    (newViewType: ExplainView) => {
      if (newViewType === 'tree') {
        switchToTreeView();
      } else {
        switchToJSONView();
      }
    },
    [switchToJSONView, switchToTreeView]
  );

  const QueryBarComponent = queryBarRef.current.component;

  return (
    <Toolbar className={explainToolbarStyles}>
      <div className={explainQueryBarStyles}>
        {
          <QueryBarComponent
            store={queryBarRef.current.store}
            actions={queryBarRef.current.actions}
            buttonLabel="Explain"
            resultId={explainResultId}
            onApply={onExecuteExplainClicked}
            onReset={onExecuteExplainClicked}
          />
        }
      </div>
      <div className={explainActionsToolbarStyles}>
        <Button
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph={'Export'} />}
          onClick={onExportToLanguageClicked}
          data-testid="explain-toolbar-export-button"
        >
          Export to language
        </Button>
        <div className={explainActionsToolbarRightStyles}>
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
            onChange={(value) => toggleView(value as ExplainView)}
          >
            <SegmentedControlOption aria-label="Visual Tree View" value="tree">
              Visual Tree
            </SegmentedControlOption>
            <SegmentedControlOption aria-label="Raw Json View" value="json">
              Raw Json
            </SegmentedControlOption>
          </SegmentedControl>
        </div>
      </div>
      {(showOutdatedWarning || showReadonlyWarning) && (
        <WarningSummary
          warnings={[
            ...(showReadonlyWarning ? [READ_ONLY_WARNING_MESSAGE] : []),
            ...(showOutdatedWarning ? [OUTDATED_WARNING_MESSAGE] : []),
          ]}
        />
      )}
      {explainErrorMessage && <ErrorSummary errors={[explainErrorMessage]} />}
    </Toolbar>
  );
}

const ExplainToolbar = withTheme(UnthemedExplainToolbar);

export { ExplainToolbar };
