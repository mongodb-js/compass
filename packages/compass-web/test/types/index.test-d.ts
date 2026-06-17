import { expectError } from 'tsd';
import { CompassWeb } from '@mongodb-js/compass-web';

// Test basic props structure.
const basicProps = {
  orgId: 'test-org',
  projectId: 'test-project',
  onActiveWorkspaceTabChange: () => {},
};

// Test that the component can be called with basic props.
void CompassWeb(basicProps);

// Test optional props are accepted.
void CompassWeb({ ...basicProps, darkMode: true, appName: 'MyApp' });

// Required props cannot be omitted
expectError(CompassWeb({ projectId: 'test-project' }));
expectError(CompassWeb({ orgId: 'test-org' }));

// Wrong callback shape should error.
expectError(
  CompassWeb({ ...basicProps, onOpenConnectViaModal: (meta: string) => {} })
);
// onOpenConnectViaModal callback receives AtlasClusterMetadata or undefined.
CompassWeb({
  ...basicProps,
  onOpenConnectViaModal: () => {},
});
