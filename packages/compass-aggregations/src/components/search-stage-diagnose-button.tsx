import React from 'react';
import { Button, Icon } from '@mongodb-js/compass-components';
import { useSearchActivationProgramP2 } from '@mongodb-js/compass-telemetry/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';

export function useShouldShowSearchStageDiagnose(
  stageOperator: string | null | undefined,
  documents: unknown[] | null | undefined
): boolean {
  const { enableSearchActivationProgramP2 } = useSearchActivationProgramP2();
  const { diagnoseSearchStage } = useAssistantActions();
  return (
    enableSearchActivationProgramP2 &&
    !!diagnoseSearchStage &&
    stageOperator === '$search' &&
    documents?.length === 0
  );
}

type SearchStageDiagnoseButtonProps = {
  onClick: () => void;
  'data-testid': string;
};

export const SearchStageDiagnoseButton: React.FunctionComponent<
  SearchStageDiagnoseButtonProps
> = ({ onClick, 'data-testid': dataTestId }) => {
  return (
    <Button
      data-testid={dataTestId}
      size="small"
      variant="primaryOutline"
      leftGlyph={<Icon glyph="Sparkle" />}
      onClick={onClick}
    >
      Diagnose this issue
    </Button>
  );
};
