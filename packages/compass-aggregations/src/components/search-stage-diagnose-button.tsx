import React from 'react';
import { Button, Icon, css, palette } from '@mongodb-js/compass-components';
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

const sparkleIconStyles = css({
  color: palette.green.dark1,
});

type SearchStageDiagnoseButtonProps = {
  stageOperator: string | null;
  stageValue: string | null;
  searchIndexName: string | null;
  'data-testid': string;
  onCloseFocusMode?: () => void;
};

export const SearchStageDiagnoseButton: React.FunctionComponent<
  SearchStageDiagnoseButtonProps
> = ({
  stageOperator,
  stageValue,
  searchIndexName,
  onCloseFocusMode,
  'data-testid': dataTestId,
}) => {
  const { diagnoseSearchStage } = useAssistantActions();

  return (
    <Button
      data-testid={dataTestId}
      size="small"
      variant="primaryOutline"
      leftGlyph={<Icon glyph="Sparkle" className={sparkleIconStyles} />}
      onClick={() => {
        onCloseFocusMode?.();
        diagnoseSearchStage?.({
          stageOperator: stageOperator ?? '',
          indexName: searchIndexName,
          stageValue: stageValue ?? '',
        });
      }}
    >
      Diagnose this issue
    </Button>
  );
};
