import React, { useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { resetGlobalCSS, css, Body } from '@mongodb-js/compass-components';
import { CompassWeb } from '../src/index';
import { SandboxConnectionStorageProvider } from '../src/connection-storage';
import { sandboxLogger } from './sandbox-logger';
import { sandboxTelemetry } from './sandbox-telemetry';
import { useAtlasProxySignIn } from './sandbox-atlas-sign-in';
import { sandboxConnectionStorage } from './sandbox-connection-storage';
import { useWorkspaceTabRouter } from './sandbox-workspace-tab-router';

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
  const { projectId, csrfToken, csrfTime } = projectParams ?? {};

  const atlasServiceSandboxBackendVariant =
    process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'local'
      ? 'web-sandbox-atlas-local'
      : process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'dev' ||
        process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'qa'
      ? 'web-sandbox-atlas-dev'
      : 'web-sandbox-atlas';

  const overrideGenAIEnablement =
    process.env.COMPASS_WEB_GEN_AI_ENABLEMENT === 'true';

  useLayoutEffect(() => {
    getMetaEl('csrf-token').setAttribute('content', csrfToken ?? '');
    getMetaEl('csrf-time').setAttribute('content', csrfTime ?? '');
  }, [csrfToken, csrfTime]);

  if (status === 'checking') {
    return null;
  }

  const isAtlas = status === 'signed-in';

  return (
    <SandboxConnectionStorageProvider
      value={isAtlas ? null : sandboxConnectionStorage}
      extraConnectionOptions={
        isAtlas
          ? // In the sandbox we're waiting for cert user to be propagated to
            // the clusters, it can take awhile on the first connection
            { connectTimeoutMS: 120_000, serverSelectionTimeoutMS: 120_000 }
          : {}
      }
    >
      <Body as="div" className={sandboxContainerStyles}>
        <CompassWeb
          orgId={''}
          projectId={projectId ?? ''}
          onActiveWorkspaceTabChange={updateCurrentTab}
          initialWorkspace={currentTab ?? undefined}
          initialPreferences={{
            enablePerformanceAdvisorBanner: isAtlas,
            enableAtlasSearchIndexes: !isAtlas,
            maximumNumberOfActiveConnections: isAtlas ? 10 : undefined,
            atlasServiceBackendPreset: atlasServiceSandboxBackendVariant,
            enableCreatingNewConnections: !isAtlas,
            enableGlobalWrites: isAtlas,
            enableRollingIndexes: isAtlas,
            enableGenAIFeaturesAtlasProject: isAtlas && overrideGenAIEnablement,
            enableGenAISampleDocumentPassingOnAtlasProject:
              isAtlas && overrideGenAIEnablement,
            enableGenAIFeaturesAtlasOrg: isAtlas && overrideGenAIEnablement,
            optInDataExplorerGenAIFeatures: isAtlas && overrideGenAIEnablement,
          }}
          onTrack={sandboxTelemetry.track}
          onDebug={sandboxLogger.debug}
          onLog={sandboxLogger.log}
        ></CompassWeb>
      </Body>
    </SandboxConnectionStorageProvider>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
