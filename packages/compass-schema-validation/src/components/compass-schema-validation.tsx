import React from 'react';
import { WorkspaceContainer } from '@mongodb-js/compass-components';
import ValidationStates from './validation-states';

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
