import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as tls from 'tls';
import { Body, css, resetGlobalCSS } from '@mongodb-js/compass-components';
import type * as CompassWebModule from '../src';

Object.assign(globalThis, {
  __compassWebSharedRuntime: {
    React,
    ReactDOM,
    // TODO(CLOUDP-262964): move Socket implementation to compass codebase
    tls,
  },
});

const sandboxContainerStyles = css({
  width: '100%',
  height: '100%',
});

resetGlobalCSS();

const App = () => {
  const [compassWebModule, setCompassWebModule] = useState<
    typeof CompassWebModule | null
  >(null);
  const [compassWebModuleError, setCompassWebModuleError] =
    useState<Error | null>(null);

  useEffect(() => {
    // @ts-expect-error sandbox won't be able to resolve this correctly from this URL
    void import(/* webpackIgnore: true */ '/compass-web.mjs')
      .then(setCompassWebModule)
      .catch(setCompassWebModuleError);
  }, []);

  if (compassWebModuleError) {
    throw compassWebModuleError;
  }

  if (!compassWebModule) {
    return null;
  }

  const { CompassWeb, getRouteFromWorkspaceTab, getWorkspaceTabFromRoute } =
    compassWebModule;

  return (
    <Body as="div" className={sandboxContainerStyles}>
      <CompassWeb
        orgId=""
        projectId=""
        initialWorkspace={
          getWorkspaceTabFromRoute(window.location.pathname) ?? undefined
        }
        onActiveWorkspaceTabChange={(tab) => {
          const newPath = getRouteFromWorkspaceTab(tab);
          window.history.replaceState(null, '', newPath);
        }}
        // Some overrides for the default compass-web preferences to enable the
        // features that would be disabled by default otherwise
        initialPreferences={{
          enableExportSchema: true,
          enablePerformanceAdvisorBanner: false,
          enableAtlasSearchIndexes: true,
          maximumNumberOfActiveConnections: undefined,
          enableCreatingNewConnections: true,
          enableGlobalWrites: false,
          enableRollingIndexes: false,
          enableGenAIFeaturesAtlasOrg: true,
          enableGenAIFeaturesAtlasProject: true,
          enableGenAISampleDocumentPassing: false,
          enableGenAIToolCallingAtlasProject: true,
          optInGenAIFeatures: false,
          enableDataModelingCollapse: true,
          enableMyQueries: false,
        }}
      ></CompassWeb>
    </Body>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
