import React from 'react';
import {
  Button,
  Icon,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import {
  useSearchActivationProgramP2,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';

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
  context: 'Stage Preview' | 'Focus Mode';
  'data-testid': string;
  // Provided in focus mode so the assistant drawer isn't obscured by the modal.
  onCloseFocusMode?: () => void;
};

/**
 * "Diagnose this issue" button shown when a $search stage returns no results.
 * Self-gates on the Search Activation Program P2 experiment, the $search
 * operator, and the assistant being enabled — renders nothing otherwise — so
 * callers can render it unconditionally in their empty-results state.
 */
export const SearchStageDiagnoseButton: React.FunctionComponent<
  SearchStageDiagnoseButtonProps
> = ({
  stageOperator,
  stageValue,
  searchIndexName,
  context,
  onCloseFocusMode,
  'data-testid': dataTestId,
}) => {
  const { enableSearchActivationProgramP2 } = useSearchActivationProgramP2();
  const { diagnoseSearchStage } = useAssistantActions();
  const track = useTelemetry();

  if (
    !enableSearchActivationProgramP2 ||
    !diagnoseSearchStage ||
    stageOperator !== '$search'
  ) {
    return null;
  }

  return (
    <div className={containerStyles}>
      <Button
        data-testid={dataTestId}
        size="small"
        // TODO(COMPASS-9751): Will be replaced with Sparkle gradient icon once Leafygreen components are updated.
        leftGlyph={<Icon glyph="Sparkle" className={sparkleIconStyles} />}
        onClick={() => {
          track('Search Stage AI Button Clicked', {
            type: 'diagnose',
            context,
          });
          onCloseFocusMode?.();
          diagnoseSearchStage({
            stageOperator,
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
