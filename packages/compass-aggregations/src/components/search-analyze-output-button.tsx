import React from 'react';
import { Button, Icon, css, palette } from '@mongodb-js/compass-components';
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

const analyzeButtonGradientWrapperStyles = css({
  display: 'inline-flex',
  alignSelf: 'flex-start',
  background: `linear-gradient(135deg, ${palette.green.dark1}, ${palette.blue.base})`,
  padding: '1px',
  borderRadius: '6px',
});

const analyzeButtonLightStyles = css({
  '&&': {
    borderColor: 'transparent',
    borderRadius: '5px',
    color: palette.green.dark1,
    '& svg': { color: palette.green.dark1 },
    '&:hover': {
      color: palette.green.dark2,
      borderColor: 'transparent',
      '& svg': { color: palette.green.dark2 },
    },
  },
});

const analyzeButtonDarkStyles = css({
  '&&': {
    borderColor: 'transparent',
    borderRadius: '5px',
    backgroundColor: palette.black,
    color: palette.white,
    '& svg': { color: palette.green.dark1 },
    '&:hover': {
      backgroundColor: palette.gray.dark4,
      color: palette.white,
      borderColor: 'transparent',
      '& svg': { color: palette.green.dark1 },
    },
  },
});

type AnalyzeAndRefineResultsButtonProps = {
  onClick: () => void;
  darkMode?: boolean;
  'data-testid': string;
};

export const AnalyzeAndRefineResultsButton: React.FunctionComponent<
  AnalyzeAndRefineResultsButtonProps
> = ({ onClick, darkMode, 'data-testid': dataTestId }) => {
  return (
    <div className={analyzeButtonGradientWrapperStyles}>
      <Button
        size="xsmall"
        className={
          darkMode ? analyzeButtonDarkStyles : analyzeButtonLightStyles
        }
        onClick={onClick}
        // TODO(COMPASS-9751): Will be replaced with Sparkle gradient icon once Leafygreen components are updated.
        leftGlyph={<Icon glyph="Sparkle" />}
        data-testid={dataTestId}
      >
        Analyze &amp; Refine Results
      </Button>
    </div>
  );
};
