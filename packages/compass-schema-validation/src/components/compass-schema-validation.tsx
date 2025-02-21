import React from 'react';
import ValidationStates from './validation-states';
import { WorkspaceContainer } from '@mongodb-js/compass-components';

/**
 * The core schema validation component.
 */
export function CompassSchemaValidation() {
  return (
    <WorkspaceContainer data-testid="compass-schema-validation">
      <ValidationStates />
    </WorkspaceContainer>
  );
}
