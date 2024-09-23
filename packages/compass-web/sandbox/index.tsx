import React from 'react';
import ReactDOM from 'react-dom';
import { resetGlobalCSS, css, Body } from '@mongodb-js/compass-components';
import { CompassWeb } from '../src/index';
import { SandboxConnectionStorageProviver } from '../src/connection-storage';
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

const App = () => {
  const [currentTab, updateCurrentTab] = useWorkspaceTabRouter();
  const { status, projectId } = useAtlasProxySignIn();

  const atlasServiceSandboxBackendVariant =
    process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'local'
      ? 'web-sandbox-atlas-local'
      : process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'dev' ||
        process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'qa'
      ? 'web-sandbox-atlas-dev'
      : 'web-sandbox-atlas';

  if (status === 'checking') {
    return null;
  }

  const isAtlas = status === 'signed-in';

  return (
    <SandboxConnectionStorageProviver
      value={isAtlas ? null : sandboxConnectionStorage}
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
          }}
          onTrack={sandboxTelemetry.track}
          onDebug={sandboxLogger.debug}
          onLog={sandboxLogger.log}
        ></CompassWeb>
      </Body>
    </SandboxConnectionStorageProviver>
  );
};

ReactDOM.render(<App></App>, document.querySelector('#sandbox-app'));
