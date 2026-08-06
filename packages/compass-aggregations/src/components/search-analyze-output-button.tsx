import React from 'react';
import {
  AssistantSparkleIcon,
  Button,
  css,
} from '@mongodb-js/compass-components';
import { toJSString } from 'mongodb-query-parser';
import { useSearchActivationProgramP2 } from '@mongodb-js/compass-telemetry/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';
import { isSearchStage } from '../utils/stage';
import type { StagePreviewMetadata } from '../utils/search-score-injection';

export type AnalyzableDocument = {
  generateObject: (options: { excludeInternalFields: boolean }) => unknown;
};

/** Builds the `output` + `documentCount` args for `interpretAnalyzeOutput`
 *  from the top preview documents and their $search score metadata. */
export function buildAnalyzeOutputContext(
  documents: AnalyzableDocument[],
  stageMetadata: StagePreviewMetadata,
  { topN = 3 }: { topN?: number } = {}
): { output: string; documentCount: number } {
  const topDocs = documents.slice(0, topN);
  const output = topDocs
    .flatMap((doc, i) => {
      const docStr = toJSString(
        doc.generateObject({ excludeInternalFields: true })
      );
      const scoreDetails = stageMetadata.scores[i];
      if (!scoreDetails) {
        return [`Document ${i + 1}:`, docStr];
      }
      return [
        `Document ${i + 1}:`,
        docStr,
        `scoreDetails: ${JSON.stringify(scoreDetails)}`,
      ];
    })
    .join('\n');
  return { output, documentCount: documents.length };
}

export function useShouldShowAnalyzeOutput(
  stageOperator: string | null | undefined,
  stageMetadata: StagePreviewMetadata | null | undefined
): boolean {
  const { enableSearchActivationProgramP2 } = useSearchActivationProgramP2({
    trackIsInSample: false,
  });
  const { interpretAnalyzeOutput } = useAssistantActions();
  return (
    enableSearchActivationProgramP2 &&
    isSearchStage(stageOperator) &&
    !!interpretAnalyzeOutput &&
    stageMetadata !== null &&
    stageMetadata !== undefined
  );
}

const analyzeButtonStyles = css({
  alignSelf: 'flex-start',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

type AnalyzeAndRefineResultsButtonProps = {
  onClick: () => void;
  'data-testid': string;
};

export const AnalyzeAndRefineResultsButton: React.FunctionComponent<
  AnalyzeAndRefineResultsButtonProps
> = ({ onClick, 'data-testid': dataTestId }) => {
  return (
    <Button
      data-testid={dataTestId}
      size="small"
      variant="primaryOutline"
      className={analyzeButtonStyles}
      leftGlyph={<AssistantSparkleIcon />}
      onClick={onClick}
    >
      Analyze &amp; Refine Results
    </Button>
  );
};
