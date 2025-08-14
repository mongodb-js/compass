import React, { useContext } from 'react';
import { DrawerSection } from '@mongodb-js/compass-components';
import { AssistantChat } from './assistant-chat';
import {
  ASSISTANT_DRAWER_ID,
  AssistantContext,
} from './compass-assistant-provider';
import { usePreference } from 'compass-preferences-model/provider';

/**
 * CompassAssistantDrawer component that wraps AssistantChat in a DrawerSection.
 * This component can be placed at any level in the component tree as long as
 * it's within an AssistantProvider.
 */
export const CompassAssistantDrawer: React.FunctionComponent<{
  autoOpen?: boolean;
}> = ({ autoOpen }) => {
  const context = useContext(AssistantContext);

  const enableAIAssistant = usePreference('enableAIAssistant');

  if (!enableAIAssistant) {
    return null;
  }

  if (!context) {
    throw new Error(
      'CompassAssistantDrawer must be used within an CompassAssistantProvider'
    );
  }

  const { chat } = context;

  return (
    <DrawerSection
      id={ASSISTANT_DRAWER_ID}
      title="MongoDB Assistant"
      label="MongoDB Assistant"
      glyph="Sparkle"
      autoOpen={autoOpen}
    >
      <AssistantChat chat={chat} />
    </DrawerSection>
  );
};
