import React from 'react';
import ValidationStates from './validation-states';
import { css, WorkspaceContainer } from '@mongodb-js/compass-components';

const styles = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  height: '100%',
});

/**
 * The core schema validation component.
 */
export function CompassSchemaValidation() {
  return (
    <div className={styles} data-testid="compass-schema-validation">
      <WorkspaceContainer>
        <ValidationStates />
      </WorkspaceContainer>
    </div>
  );
}
