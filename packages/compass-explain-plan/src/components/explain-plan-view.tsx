import React, { useMemo, useState } from 'react';
import {
  Banner,
  Icon,
  KeylineCard,
  SegmentedControl,
  SegmentedControlOption,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  prettify,
} from '@mongodb-js/compass-editor';
import type { ExplainPlanModalState } from '../stores/explain-plan-modal-store';
import ExplainTree from './explain-tree';
import ExplainPlanSummary from './explain-plan-side-summary';
import ExplainCannotVisualizeBanner from './explain-cannot-visualize-banner';
import { ZoomControl } from './zoom-control';

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
  bottom: spacing[3],
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
  rowGap: spacing[4],
});

const viewHeaderStyles = css({
  display: 'grid',
  rowGap: spacing[4],
});

const viewBodyContainerStyles = css({
  display: 'flex',
  overflow: 'hidden',
  gap: spacing[4],
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
    paddingLeft: spacing[2],
  },
});

const explainTreeContainerStyles = css({
  height: '100%',
  overflow: 'auto',
});

const summaryStyles = css({
  flex: 'none',
});

type ExplainPlanViewProps = Partial<
  Pick<ExplainPlanModalState, 'explainPlan' | 'rawExplainPlan' | 'error'>
>;

export const ExplainPlanView: React.FunctionComponent<ExplainPlanViewProps> = ({
  explainPlan,
  rawExplainPlan,
  error,
}) => {
  const [viewType, setViewType] = useState<'tree' | 'json'>(
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

  const isParsingError = Boolean(error && rawExplainPlan && !explainPlan);

  if (error && !isParsingError) {
    return <Banner variant="danger">{error}</Banner>;
  }

  return (
    <div className={viewStyles}>
      <div className={viewHeaderStyles}>
        <SegmentedControl
          onChange={setViewType as (value: string) => void}
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
            value="json"
            glyph={<Icon glyph="CurlyBraces"></Icon>}
            disabled={!!error}
          >
            Raw Output
          </SegmentedControlOption>
        </SegmentedControl>
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
