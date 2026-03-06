import { expectError } from 'tsd';
import { CompassWeb } from '@mongodb-js/compass-web';

// Test basic props structure
const basicProps = {
  orgId: 'test-org',
  projectId: 'test-project',
  onActiveWorkspaceTabChange: () => {},
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

// This should cause an error - optInDataExplorerGenAIFeatures is an old name
expectError(
  CompassWeb({
    ...basicProps,
    initialPreferences: {
      optInDataExplorerGenAIFeatures: true,
    },
  })
);
