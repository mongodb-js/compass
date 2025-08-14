import React, { useContext } from 'react';
import { DrawerSection } from '@mongodb-js/compass-components';
import { AssistantChat } from './assistant-chat';
import { ASSISTANT_DRAWER_ID, AssistantContext } from './assistant-provider';

/**
 * AssistantDrawer component that wraps AssistantChat in a DrawerSection.
 * This component can be placed at any level in the component tree as long as
 * it's within an AssistantProvider.
 */
export const AssistantDrawer: React.FunctionComponent = () => {
  const context = useContext(AssistantContext);

  if (!context) {
    throw new Error(
      'CompassAssistantDrawer must be used within an CompassAssistantProvider'
    );
  }

  if (!context.isEnabled) {
    return null;
  }

  const { chat } = context;

  return (
    <DrawerSection
      id={ASSISTANT_DRAWER_ID}
      title="MongoDB Assistant"
      label="MongoDB Assistant"
      glyph="Sparkle"
    >
      <AssistantChat chat={chat} />
    </DrawerSection>
  );
};
