import React from 'react';
import {
  AssistantSparkleIcon,
  Button,
  css,
} from '@mongodb-js/compass-components';
import { useSearchActivationProgramP2 } from '@mongodb-js/compass-telemetry/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';

const diagnoseButtonStyles = css({
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

export function useShouldShowSearchStageDiagnose(
  stageOperator: string | null | undefined,
  documents: unknown[] | null | undefined
): boolean {
  const { enableSearchActivationProgramP2 } = useSearchActivationProgramP2({
    trackIsInSample: false,
  });
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
      className={diagnoseButtonStyles}
      leftGlyph={<AssistantSparkleIcon />}
      onClick={onClick}
    >
      Investigate no results
    </Button>
  );
};
