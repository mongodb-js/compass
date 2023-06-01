import React, { useState, useMemo } from 'react';
import {
  css,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';

import type { ExplainTreeNodeData } from './explain-tree-data';
import { executionStatsToTreeData } from './explain-tree-data';
import type { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import TreeLayout from './tree-layout';
import {
  defaultCardHeight,
  defaultCardWidth,
  highlightFieldHeight,
  shardCardHeight,
  ExplainTreeStage,
} from './explain-tree-stage';

interface ExplainTreeProps {
  executionStats: ExplainPlan['executionStats'];
}

const explainTreeStyles = css({
  zIndex: 1,
});

const getNodeSize = (node: ExplainTreeNodeData): [number, number] => {
  // Note: these values must match the actual styles of the explain stage card:

  const highlightsHeight =
    Object.keys(node.highlights).length * highlightFieldHeight;

  const notShardHeight = defaultCardHeight + highlightsHeight;
  const height = node.isShard ? shardCardHeight : notShardHeight;

  return [defaultCardWidth, height];
};

const getNodeKey = (node: ExplainTreeNodeData) => node.id;

const ExplainTree: React.FunctionComponent<ExplainTreeProps> = ({
  executionStats,
}) => {
  const darkMode = useDarkMode();
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);

  const root = useMemo(
    () => executionStatsToTreeData(executionStats),
    [executionStats]
  );

  if (!root) return null;

  return (
    <TreeLayout<ExplainTreeNodeData>
      data-testid="explain-tree"
      data={root}
      getNodeSize={getNodeSize}
      getNodeKey={getNodeKey}
      linkColor={darkMode ? palette.gray.base : palette.gray.light2}
      linkWidth={6}
      horizontalSpacing={spacing[6]}
      verticalSpacing={spacing[6]}
      className={explainTreeStyles}
    >
      {(node) => {
        const key = getNodeKey(node);
        return (
          <div
            style={{
              position: 'relative',
              zIndex: detailsOpen === key ? 2 : 1,
            }}
          >
            <ExplainTreeStage
              detailsOpen={detailsOpen === key}
              onToggleDetailsClick={() => {
                detailsOpen === key
                  ? setDetailsOpen(null)
                  : setDetailsOpen(key);
              }}
              {...node}
              totalExecTimeMS={root.curStageExecTimeMS}
            ></ExplainTreeStage>
          </div>
        );
      }}
    </TreeLayout>
  );
};

export default ExplainTree;
