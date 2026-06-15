import React from 'react';
import { Button, Icon, palette } from '@mongodb-js/compass-components';
import type { ProactiveInsightsContext } from '../prompts';
import { useAssistantAction } from '../hooks/use-assistant-action';

type AssistantButtonProps = {
  insightContext: ProactiveInsightsContext;
  onBeforeAssistantOpen?: () => void;
  children?: React.ReactNode;
  size?: 'xsmall' | 'small' | 'default' | 'large';
  className?: string;
  'data-testid'?: string;
  disabled?: boolean;
  variant?:
    | 'default'
    | 'primary'
    | 'primaryOutline'
    | 'danger'
    | 'dangerOutline'
    | 'baseGreen';
};

export function AssistantButton({
  insightContext,
  onBeforeAssistantOpen,
  children,
  ...rest
}: AssistantButtonProps) {
  const action = useAssistantAction(insightContext);
  if (!action) return null;
  return (
    <Button
      leftGlyph={
        <Icon glyph="Sparkle" style={{ color: palette.green.dark1 }} />
      }
      onClick={() => {
        onBeforeAssistantOpen?.();
        action();
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}
