import { expectType, expectError } from 'tsd';
import { CompassWeb } from '@mongodb-js/compass-web';

// Test basic props structure
const basicProps = {
  orgId: 'test-org',
  projectId: 'test-project',
  onActiveWorkspaceTabChange: () => {},
  onFailToLoadConnections: () => {},
};

// Test that the component can be called with basic props
void CompassWeb(basicProps);

// Test preference property validation
// This should work - optInGenAIFeatures is the correct external property name
void CompassWeb({
  ...basicProps,
  initialPreferences: {
    optInGenAIFeatures: true,
  },
});

// This should cause an error - optInDataExplorerGenAIFeatures is internal only
expectError(
  CompassWeb({
    ...basicProps,
    initialPreferences: {
      optInDataExplorerGenAIFeatures: true,
    },
  })
);

// Test that built-in types are properly accessible (URL should be global)
expectType<URL>(new URL('https://example.com'));

// Basic smoke test - if we can get here, the main types are working
expectType<string>('test-success');
