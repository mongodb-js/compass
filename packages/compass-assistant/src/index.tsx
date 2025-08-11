import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { activateAssistantPlugin } from './stores';
import { AssistantDrawerSection } from './assistant-drawer-section';

const CompassAssistant = registerCompassPlugin(
  {
    name: 'CompassAssistant',
    component: AssistantDrawerSection,
    activate: activateAssistantPlugin,
  },
  {
    logger: createLoggerLocator('COMPASS-ASSISTANT'),
  }
);

export { CompassAssistant };
export default CompassAssistant;

// Export hooks and types for external use
export { useAssistant } from './stores/hooks';

export type { AssistantState } from './stores';
