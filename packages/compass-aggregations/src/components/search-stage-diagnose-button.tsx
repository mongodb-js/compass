import React from 'react';
import {
  Button,
  Icon,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import { useSearchActivationProgramP2 } from '@mongodb-js/compass-telemetry/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';

/**
 * Whether the "Diagnose this issue" button should be shown for a stage: the P2
 * experiment is on, the assistant is available, and it's a $search stage with
 * no results. Callers own the render decision so the button itself stays dumb.
 */
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
    (documents?.length ?? 0) === 0
  );
}

const containerStyles = css({
  marginTop: spacing[200],
});

const sparkleIconStyles = css({
  color: palette.green.dark1,
});

type SearchStageDiagnoseButtonProps = {
  stageOperator: string | null;
  stageValue: string | null;
  searchIndexName: string | null;
  'data-testid': string;
  // Provided in focus mode so the assistant drawer isn't obscured by the modal.
  onCloseFocusMode?: () => void;
};

/**
 * "Diagnose this issue" button shown when a $search stage returns no results.
 * Callers are responsible for only rendering it when it should appear (P2
 * experiment on, assistant available, $search stage with no results).
 */
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
    <div className={containerStyles}>
      <Button
        data-testid={dataTestId}
        size="small"
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
    </div>
  );
};
