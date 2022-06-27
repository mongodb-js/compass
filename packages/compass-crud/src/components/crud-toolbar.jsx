import React, { useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  Body,
  Button,
  css,
  Icon,
  IconButton,
  SegmentedControl,
  SegmentedControlOption,
  SpinLoader,
  Toolbar
} from '@mongodb-js/compass-components';

const { track } = createLoggerAndTelemetry('COMPASS-CRUD-UI');

const toolbarLeftActionStyles = css({
  flexGrow: 1
});

const crudQueryBarStyles = css({
  width: '100%',
  position: 'relative',
});

function CrudToolbar({
  activeDocumentView,
  count,
  end,
  getPage,
  insertHandler,
  isExportable,
  loadingCount,
  localAppRegistry,
  onApplyClicked,
  onResetClicked,
  openExportFileDialog,
  page,
  pageLoadedListenable,
  readonly,
  refreshDocuments,
  resultId,
  start,
  viewSwitchHandler,
}) {
  const queryBarRole = localAppRegistry.getRole('Query.QueryBar')[0];

  const queryBarRef = useRef(isExportable ? {
    component: queryBarRole.component,
    store: localAppRegistry.getStore(queryBarRole.storeName),
    actions: localAppRegistry.getAction(queryBarRole.actionName),
  } : null);

  const displayedDocumentCount = useMemo(
    () => loadingCount
      ? ''
      : `${count ?? 'N/A'}`,
    [loadingCount, count]
  );

  const onClickRefreshDocuments = useCallback(() => {
    track('Query Results Refreshed');
    refreshDocuments();
  }, [ refreshDocuments ]);

  const QueryBarComponent = isExportable ? queryBarRef.current.component : null;

  return (
    <Toolbar>
      <div className={crudQueryBarStyles}>
        {isExportable && (
          <QueryBarComponent
            store={queryBarRef.current.store}
            actions={queryBarRef.current.actions}
            resultId={resultId}
            buttonLabel="Find"
            onApply={onApplyClicked}
            onReset={onResetClicked}
          />
        )}
      </div>
      <div>
        <div className={toolbarLeftActionStyles}>
          <Button
            leftGlyph={<Icon glyph="Download" />}
            rightGlyph={<Icon glyph="CaretDown" />}
            variant="primary"
          >
            Add Data
          </Button>
          <Button
            leftGlyph={<Icon glyph="Export" />}
          >
            Export Collection
          </Button>
        </div>
        <div>
          <Body>
            {start} - {end} of {displayedDocumentCount}
          </Body>
          {loadingCount && (
            <SpinLoader
              size="12px"
              title="Fetching document count…"
            />
          )}
          <IconButton
            aria-label="Refresh document count"
            title="Refresh document count"
            onClick={onClickRefreshDocuments}
          >
            <Icon glyph="Refresh" />
          </IconButton>
          <SegmentedControl
            darkMode={darkMode}
            id={controlId}
            // aria-labelledby={labelId}
            aria-label="Refresh documents"
            size="small"
            value={3}
            onChange={(value) => alert('coming soon')}
          >
            <SegmentedControlOption aria-label="Visual Tree View" value="tree">
              1
            </SegmentedControlOption>
            <SegmentedControlOption aria-label="Raw Json View" value="json">
              2
            </SegmentedControlOption>
          </SegmentedControl>
        </div>
      </div>
    </Toolbar>
  );
}

CrudToolbar.propTypes = {
  activeDocumentView: PropTypes.string.isRequired,
  count: PropTypes.number,
  end: PropTypes.number.isRequired,
  getPage: PropTypes.func.isRequired,
  insertHandler: PropTypes.func,
  isExportable: PropTypes.bool.isRequired,
  loadingCount: PropTypes.bool.isRequired,
  localAppRegistry: PropTypes.object.isRequired,
  onApplyClicked: PropTypes.func.isRequired,
  onResetClicked: PropTypes.func.isRequired,
  openExportFileDialog: PropTypes.func,
  page: PropTypes.number.isRequired,
  pageLoadedListenable: PropTypes.object.isRequired,
  readonly: PropTypes.bool.isRequired,
  refreshDocuments: PropTypes.func.isRequired,
  resultId: PropTypes.string.isRequired,
  start: PropTypes.number.isRequired,
  viewSwitchHandler: PropTypes.func.isRequired,
};

export {
  CrudToolbar
};
