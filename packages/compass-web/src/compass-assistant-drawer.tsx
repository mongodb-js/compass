import { useHasNonGenuineConnections } from '@mongodb-js/compass-app-stores/provider';
import React from 'react';
import { CompassAssistantDrawer } from '@mongodb-js/compass-assistant';

// TODO(COMPASS-7830): This is a temporary solution to pass the
// hasNonGenuineConnections prop to the CompassAssistantDrawer as otherwise
// we end up with a circular dependency.
export function CompassAssistantDrawerWithConnections({
  appName,
}: {
  appName: string;
}) {
  const hasNonGenuineConnections = useHasNonGenuineConnections();

  return (
    <CompassAssistantDrawer
      appName={appName}
      hasNonGenuineConnections={hasNonGenuineConnections}
      allowSavingPreferences={false}
    />
  );
}
