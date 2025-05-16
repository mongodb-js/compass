import React, { useCallback, useMemo, useState } from 'react';
import {
  Banner,
  Button,
  Icon,
  KeylineCard,
  SegmentedControl,
  SegmentedControlOption,
  css,
  aiIconGlyph,
  aiIconColor,
  spacing,
} from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  prettify,
} from '@mongodb-js/compass-editor';
import { type ExplainPlanModalState } from '../stores/explain-plan-modal-store';
import ExplainTree from './explain-tree';
import ExplainPlanSummary from './explain-plan-side-summary';
import ExplainCannotVisualizeBanner from './explain-cannot-visualize-banner';
import { ZoomControl } from './zoom-control';
import ExplainPlanAIView from './explain-plan-ai-view';

const zoomableTreeContainerStyles = css({
  position: 'relative',
  width: '100%',
  height: '100%',
});

const zoomableTreeContentStyles = css({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'auto',
});

const zoomableTreeControlsStyles = css({
  position: 'absolute',
  left: 0,
  bottom: spacing[400],
});

const ZoomableExplainTree: React.FunctionComponent<
  Omit<React.ComponentProps<typeof ExplainTree>, 'scale'>
> = ({ executionStats }) => {
  const [scale, setScale] = useState(1);

  return (
    <div className={zoomableTreeContainerStyles}>
      <div className={zoomableTreeContentStyles}>
        <ExplainTree
          executionStats={executionStats}
          scale={scale}
        ></ExplainTree>
      </div>
      <div className={zoomableTreeControlsStyles}>
        <ZoomControl value={scale} onZoomChange={setScale}></ZoomControl>
      </div>
    </div>
  );
};

const viewStyles = css({
  height: '100%',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto 1fr',
  rowGap: spacing[600],
});

const viewHeaderStyles = css({
  display: 'grid',
  rowGap: spacing[600],
});

const viewActionStyles = css({
  display: 'flex',
  gap: spacing[300],
  alignItems: 'center',
});

const viewBodyContainerStyles = css({
  display: 'flex',
  overflow: 'hidden',
  gap: spacing[600],
});

const contentStyles = css({
  flex: '1 1 0%',
  minWidth: '0%',
});

const editorContainerStyles = css({
  height: '100%',
  overflow: 'hidden',
});

const editorStyles = css({
  '& .cm-editor': {
    paddingLeft: spacing[200],
  },
});

const explainTreeContainerStyles = css({
  height: '100%',
  overflow: 'auto',
});

const summaryStyles = css({
  flex: 'none',
});

const openInChatStyles = css({
  // padding: spacing[200],
  // marginLeft: spacing[200]
});

type ExplainPlanViewProps = {
  onGenerateAIAnalysis: () => void;
  onClickOpenInChat: () => void;
} & Partial<
  Pick<
    ExplainPlanModalState,
    'aiFetchStatus' | 'explainPlan' | 'rawExplainPlan' | 'error'
  >
>;

export const ExplainPlanView: React.FunctionComponent<ExplainPlanViewProps> = ({
  explainPlan,
  rawExplainPlan,
  onGenerateAIAnalysis,
  onClickOpenInChat,
  aiFetchStatus,
  error,
}) => {
  const [viewType, setViewType] = useState<'tree' | 'json' | 'ai-analysis'>(
    error ? 'json' : 'tree'
  );

  const rawExplainPlanText = useMemo(() => {
    return rawExplainPlan
      ? prettify(JSON.stringify(rawExplainPlan), 'json')
      : '';
  }, [rawExplainPlan]);

  const explainPlanIndexFields = useMemo(() => {
    return (
      explainPlan?.usedIndexes.flatMap((index) => {
        return Object.entries(index.fields);
      }) ?? []
    );
  }, [explainPlan]);

  const onSetViewType = useCallback(
    (viewType: string) => {
      setViewType(viewType as 'tree' | 'json' | 'ai-analysis');

      if (viewType === 'ai-analysis' && aiFetchStatus === 'initial') {
        onGenerateAIAnalysis();
      }
    },
    [setViewType, aiFetchStatus, onGenerateAIAnalysis]
  );

  const isParsingError = Boolean(error && rawExplainPlan && !explainPlan);

  if (error && !isParsingError) {
    return <Banner variant="danger">{error}</Banner>;
  }

  return (
    <div className={viewStyles}>
      <div className={viewHeaderStyles}>
        <div className={viewActionStyles}>
          <SegmentedControl
            onChange={onSetViewType}
            value={viewType}
            data-testid="explain-view-type-control"
          >
            <SegmentedControlOption
              value="tree"
              glyph={<Icon glyph="Diagram"></Icon>}
              disabled={!!error}
            >
              Visual Tree
            </SegmentedControlOption>
            <SegmentedControlOption
              value="ai-analysis"
              glyph={<Icon glyph="CurlyBraces"></Icon>}
              disabled={!!error}
            >
              AI Analysis
            </SegmentedControlOption>
            <SegmentedControlOption
              value="json"
              glyph={<Icon glyph="CurlyBraces"></Icon>}
              disabled={!!error}
            >
              Raw Output
            </SegmentedControlOption>
          </SegmentedControl>
          <Button
            className={openInChatStyles}
            onClick={onClickOpenInChat}
            leftGlyph={<Icon glyph={aiIconGlyph} color={aiIconColor}></Icon>}
            size="small"
          >
            Open in Chat
          </Button>
        </div>
        {isParsingError && (
          <ExplainCannotVisualizeBanner></ExplainCannotVisualizeBanner>
        )}
      </div>
      <div className={viewBodyContainerStyles}>
        <div className={contentStyles}>
          {viewType === 'json' && (
            <KeylineCard className={editorContainerStyles}>
              <CodemirrorMultilineEditor
                language="json"
                text={rawExplainPlanText}
                readOnly={true}
                showAnnotationsGutter={false}
                showLineNumbers={false}
                formattable={false}
                initialJSONFoldAll={false}
                editorClassName={editorStyles}
                data-testid="raw-explain-plan"
              ></CodemirrorMultilineEditor>
            </KeylineCard>
          )}
          {viewType === 'tree' && (
            <div className={explainTreeContainerStyles}>
              <ZoomableExplainTree
                executionStats={explainPlan?.executionStats}
              ></ZoomableExplainTree>
            </div>
          )}
          {viewType === 'ai-analysis' && (
            <div className={explainTreeContainerStyles}>
              <ExplainPlanAIView />
            </div>
          )}
        </div>
        {!isParsingError && (
          <div className={summaryStyles}>
            <ExplainPlanSummary
              docsReturned={explainPlan?.nReturned ?? 0}
              docsExamined={explainPlan?.totalDocsExamined ?? 0}
              executionTimeMs={explainPlan?.executionTimeMillis ?? 0}
              sortedInMemory={explainPlan?.inMemorySort ?? false}
              indexKeysExamined={explainPlan?.totalKeysExamined ?? 0}
              indexType={explainPlan?.indexType ?? 'UNAVAILABLE'}
              indexKeys={explainPlanIndexFields}
            ></ExplainPlanSummary>
          </div>
        )}
      </div>
    </div>
  );
};
