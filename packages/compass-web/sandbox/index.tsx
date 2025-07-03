import React, { useCallback, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  resetGlobalCSS,
  css,
  Body,
  openToast,
} from '@mongodb-js/compass-components';
import type { AllPreferences } from 'compass-preferences-model';
import { CompassWeb } from '../src/index';
import { SandboxConnectionStorageProvider } from '../src/connection-storage';
import { sandboxLogger } from './sandbox-logger';
import { sandboxTelemetry } from './sandbox-telemetry';
import { useAtlasProxySignIn } from './sandbox-atlas-sign-in';
import { sandboxConnectionStorage } from './sandbox-connection-storage';
import { useWorkspaceTabRouter } from './sandbox-workspace-tab-router';
import {
  SandboxPreferencesUpdateProvider,
  type SandboxPreferencesUpdateTrigger,
} from '../src/preferences';

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
    projectId,
    csrfToken,
    csrfTime,
    enableGenAIFeaturesAtlasProject,
    enableGenAISampleDocumentPassingOnAtlasProject,
    enableGenAIFeaturesAtlasOrg,
    optInDataExplorerGenAIFeatures,
  } = projectParams ?? {};

  const atlasServiceSandboxBackendVariant =
    process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'local'
      ? 'web-sandbox-atlas-local'
      : process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'dev'
      ? 'web-sandbox-atlas-dev'
      : process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'qa'
      ? 'web-sandbox-atlas-qa'
      : 'web-sandbox-atlas';

  const sandboxPreferencesUpdateTrigger =
    useRef<null | SandboxPreferencesUpdateTrigger>(null);

  const enablePreferencesUpdateTrigger =
    process.env.E2E_TEST_CLOUD_WEB_ENABLE_PREFERENCE_SAVING === 'true';
  if (
    enablePreferencesUpdateTrigger &&
    sandboxPreferencesUpdateTrigger.current === null
  ) {
    sandboxPreferencesUpdateTrigger.current = (
      updatePreference: (preferences: Partial<AllPreferences>) => Promise<void>
    ) => {
      // Useful for e2e test to override preferences.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).__compassWebE2ETestSavePreferences = async (
        attributes: Partial<AllPreferences>
      ) => {
        await updatePreference(attributes);
      };

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (globalThis as any).__compassWebE2ETestSavePreferences;
      };
    };
  }

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

  return (
    <SandboxConnectionStorageProvider
      value={isAtlas ? null : sandboxConnectionStorage}
    >
      <SandboxPreferencesUpdateProvider
        value={sandboxPreferencesUpdateTrigger.current}
      >
        <Body as="div" className={sandboxContainerStyles}>
          <CompassWeb
            orgId={''}
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
                isAtlas && !!enableGenAIFeaturesAtlasProject,
              enableGenAISampleDocumentPassingOnAtlasProject:
                isAtlas && !!enableGenAISampleDocumentPassingOnAtlasProject,
              enableGenAIFeaturesAtlasOrg:
                isAtlas && !!enableGenAIFeaturesAtlasOrg,
              optInDataExplorerGenAIFeatures:
                isAtlas && !!optInDataExplorerGenAIFeatures,
              enableDataModeling: true,
            }}
            onTrack={sandboxTelemetry.track}
            onDebug={sandboxLogger.debug}
            onLog={sandboxLogger.log}
            onFailToLoadConnections={onFailToLoadConnections}
          ></CompassWeb>
        </Body>
      </SandboxPreferencesUpdateProvider>
    </SandboxConnectionStorageProvider>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
