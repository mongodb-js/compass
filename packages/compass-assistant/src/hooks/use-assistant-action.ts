import { useMemo, useRef } from 'react';
import { useAssistantActions } from '../compass-assistant-provider';
import type { ProactiveInsightsContext } from '../prompts';

export function useAssistantAction(
  context: ProactiveInsightsContext
): (() => void) | undefined {
  const { openAssistant } = useAssistantActions();
  const contextRef = useRef(context);
  contextRef.current = context;
  return useMemo(
    () => (openAssistant ? () => openAssistant(contextRef.current) : undefined),
    [openAssistant]
  );
}
