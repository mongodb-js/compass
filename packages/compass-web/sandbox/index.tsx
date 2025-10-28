import React, { useCallback, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Body,
  css,
  openToast,
  resetGlobalCSS,
} from '@mongodb-js/compass-components';
import { CompassWeb } from '../src/index';
import { SandboxConnectionStorageProvider } from '../src/connection-storage';
import './sandbox-process';
import { sandboxLogger } from './sandbox-logger';
import { sandboxTelemetry } from './sandbox-telemetry';
import { useAtlasProxySignIn } from './sandbox-atlas-sign-in';
import { sandboxConnectionStorage } from './sandbox-connection-storage';
import { useWorkspaceTabRouter } from './sandbox-workspace-tab-router';
import { SandboxPreferencesGlobalAccessProvider } from '../src/preferences';

const sandboxContainerStyles = css({
  width: '100%',
  height: '100%',
});

resetGlobalCSS();

function getMetaEl(name: string) {
  return (
    document.querySelector(`meta[name="${name}" i]`) ??
    (() => {
      const el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.prepend(el);
      return el;
    })()
  );
}

const App = () => {
  const [currentTab, updateCurrentTab] = useWorkspaceTabRouter();
  const { status, projectParams } = useAtlasProxySignIn();
  const {
    orgId,
    projectId,
    csrfToken,
    csrfTime,
    enableGenAIFeaturesAtlasProject,
    enableGenAISampleDocumentPassing,
    enableGenAIFeaturesAtlasOrg,
    optInGenAIFeatures,
    userRoles,
  } = projectParams ?? {};

  const atlasServiceSandboxBackendVariant =
    process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'local'
      ? 'web-sandbox-atlas-local'
      : process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'dev'
      ? 'web-sandbox-atlas-dev'
      : process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'qa'
      ? 'web-sandbox-atlas-qa'
      : 'web-sandbox-atlas';

  useLayoutEffect(() => {
    getMetaEl('csrf-token').setAttribute('content', csrfToken ?? '');
    getMetaEl('csrf-time').setAttribute('content', csrfTime ?? '');
  }, [csrfToken, csrfTime]);

  const onFailToLoadConnections = useCallback((error: Error) => {
    openToast('failed-to-load-connections', {
      title: 'Failed to load connections',
      description: error.message,
      variant: 'warning',
    });
  }, []);

  if (status === 'checking') {
    return null;
  }

  const isAtlas = status === 'signed-in';

  const groupRolePreferences = (() => {
    if (!isAtlas) {
      return {};
    }
    if (userRoles?.isDataAccessAdmin) {
      return {};
    }
    if (userRoles?.isDataAccessWrite) {
      return { readWrite: true };
    }
    return { readOnly: true };
  })();

  return (
    <SandboxConnectionStorageProvider
      value={isAtlas ? null : sandboxConnectionStorage}
    >
      <SandboxPreferencesGlobalAccessProvider>
        <Body as="div" className={sandboxContainerStyles}>
          <CompassWeb
            orgId={orgId ?? ''}
            projectId={projectId ?? ''}
            onActiveWorkspaceTabChange={updateCurrentTab}
            initialWorkspace={currentTab ?? undefined}
            initialPreferences={{
              enableExportSchema: true,
              enablePerformanceAdvisorBanner: isAtlas,
              enableAtlasSearchIndexes: !isAtlas,
              maximumNumberOfActiveConnections: isAtlas ? 10 : undefined,
              atlasServiceBackendPreset: atlasServiceSandboxBackendVariant,
              enableCreatingNewConnections: !isAtlas,
              enableGlobalWrites: isAtlas,
              enableRollingIndexes: isAtlas,
              showDisabledConnections: true,
              enableGenAIFeaturesAtlasProject:
                !isAtlas || !!enableGenAIFeaturesAtlasProject,
              enableGenAISampleDocumentPassing:
                !isAtlas || !!enableGenAISampleDocumentPassing,
              enableGenAIFeaturesAtlasOrg:
                !isAtlas || !!enableGenAIFeaturesAtlasOrg,
              optInGenAIFeatures: isAtlas ? !!optInGenAIFeatures : false,
              enableDataModeling: true,
              enableMyQueries: isAtlas,
              ...groupRolePreferences,
            }}
            onTrack={sandboxTelemetry.track}
            onDebug={sandboxLogger.debug}
            onLog={sandboxLogger.log}
            onFailToLoadConnections={onFailToLoadConnections}
          ></CompassWeb>
        </Body>
      </SandboxPreferencesGlobalAccessProvider>
    </SandboxConnectionStorageProvider>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
