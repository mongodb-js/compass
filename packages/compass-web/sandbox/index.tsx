import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as tls from 'tls';
import {
  Body,
  CompassComponentsProvider,
  css,
  resetGlobalCSS,
} from '@mongodb-js/compass-components';
import type * as CompassWebModule from '../src';
import { OpenInAtlasToast } from './open-in-atlas-toast';
import { createHashHistory } from 'history';

const hashHistory = createHashHistory();

Object.assign(globalThis, {
  __compassWebSharedRuntime: {
    React,
    ReactDOM,
    // TODO(CLOUDP-262964): move Socket implementation to compass codebase
    tls,
  },
  // Two conditions need to be matching: this value set to true AND special
  // imports added directly to the compass-web build, there is no way to
  // activate this otherwise
  __compassWebEnableSandboxStorage: true,
  // For testing purposes to programmatically trigger navigation
  hashHistory,
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
    // @ts-expect-error this is a "public" url of the asset produced by webpack,
    // TS won't be able to resolve the types from that
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

  const { CompassWeb } = compassWebModule;

  return (
    <CompassComponentsProvider>
      <Body as="div" className={sandboxContainerStyles}>
        <CompassWeb
          orgId=""
          projectId=""
          // Some overrides for the default compass-web preferences to enable
          // the features that would be disabled by default otherwise
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
          history={hashHistory}
        ></CompassWeb>
        <OpenInAtlasToast></OpenInAtlasToast>
      </Body>
    </CompassComponentsProvider>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
