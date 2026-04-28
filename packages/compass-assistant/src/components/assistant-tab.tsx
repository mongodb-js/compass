import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Combobox,
  ComboboxOption,
  css,
  Icon,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  useIsAIFeatureEnabled,
  usePreference,
} from 'compass-preferences-model/provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { AssistantChat } from './assistant-chat';
import { AssistantContext } from '../compass-assistant-provider';
import { ClearChatButton } from '../compass-assistant-drawer';
import {
  useAssistantGlobalState,
  useSyncAssistantGlobalState,
} from '../assistant-global-state';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  minWidth: 0,
});

const headerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[400],
  padding: `${spacing[200]}px ${spacing[400]}px`,
  borderBottom: `1px solid ${palette.gray.light2}`,
});

const headerStylesDark = css({
  borderBottom: `1px solid ${palette.gray.dark2}`,
});

const titleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontWeight: 600,
  flexShrink: 0,
});

const sparkleIconStyle = {
  color: palette.green.dark1,
};

const connectionPickerStyles = css({
  flex: 1,
  maxWidth: spacing[1600] * 5,
});

const chatWrapperStyles = css({
  flex: 1,
  minHeight: 0,
});

const disabledStateStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  padding: spacing[600],
  textAlign: 'center',
});

export const AssistantTab: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  const chat = useContext(AssistantContext);
  const enableAIAssistant = usePreference('enableAIAssistant');
  const isAiFeatureEnabled = useIsAIFeatureEnabled();
  const { activeConnections } = useAssistantGlobalState();

  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);

  // Default to the first active connection once we have one, and clear the
  // selection if the chosen connection goes away.
  useEffect(() => {
    if (
      selectedConnectionId &&
      !activeConnections.some((conn) => conn.id === selectedConnectionId)
    ) {
      setSelectedConnectionId(null);
      return;
    }
    if (!selectedConnectionId && activeConnections.length > 0) {
      setSelectedConnectionId(activeConnections[0].id);
    }
  }, [activeConnections, selectedConnectionId]);

  useSyncAssistantGlobalState('assistantTabConnectionId', selectedConnectionId);

  const handleConnectionChange = useCallback((value: string | null) => {
    if (value) {
      setSelectedConnectionId(value);
    }
  }, []);

  const isAssistantEnabled = enableAIAssistant && isAiFeatureEnabled;

  if (!isAssistantEnabled || !chat) {
    return (
      <div className={disabledStateStyles}>
        <p>The MongoDB Assistant is currently unavailable.</p>
      </div>
    );
  }

  return (
    <div className={containerStyles} data-testid="assistant-tab">
      <div className={darkMode ? headerStylesDark : headerStyles}>
        <span className={titleStyles}>
          <Icon glyph="Sparkle" size="large" style={sparkleIconStyle} />
          MongoDB Assistant
        </span>
        <div className={connectionPickerStyles}>
          <Combobox
            aria-label="Select connection"
            placeholder={
              activeConnections.length === 0
                ? 'No active connections'
                : 'Select connection'
            }
            value={selectedConnectionId ?? ''}
            data-testid="assistant-tab-connection-selector"
            onChange={handleConnectionChange}
            clearable={false}
            multiselect={false}
            disabled={activeConnections.length === 0}
            size="small"
          >
            {activeConnections.map((connection) => (
              <ComboboxOption
                key={connection.id}
                value={connection.id}
                displayName={getConnectionTitle(connection)}
              />
            ))}
          </Combobox>
        </div>
        <ClearChatButton chat={chat} />
      </div>
      <div className={chatWrapperStyles}>
        <AssistantChat chat={chat} />
      </div>
    </div>
  );
};
