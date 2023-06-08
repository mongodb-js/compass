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
  ExplainTreeStage,
  shardCardHeight,
} from './explain-tree-stage';

interface ExplainTreeProps {
  executionStats: ExplainPlan['executionStats'];
  scale?: number;
}

const explainTreeStyles = css({
  zIndex: 1,
});

const TREE_VERTICAL_SPACING = 38;
const TREE_VERTICAL_SPACING_BELOW_SHARD_CARD = 12;
const TREE_HORIZONTAL_SPACING = spacing[6];

const getNodeSize = (node: ExplainTreeNodeData): [number, number] => {
  // Note: these values must match the actual styles of the explain stage card:

  const highlightsHeight =
    Object.keys(node.highlights).length * highlightFieldHeight;

  const notShardHeight = defaultCardHeight + highlightsHeight;
  const height = node.isShard
    ? // In tree layout we add `TREE_VERTICAL_SPACING` amount to the height of the
      // node to account for gap. Here we wish to reduce the space between a shard
      // card and its descendent and to keep the layout logic decoupled from the
      // index tree specifics we reduce that amount and add our custom amount of
      // space for a shard card
      shardCardHeight +
      TREE_VERTICAL_SPACING_BELOW_SHARD_CARD -
      TREE_VERTICAL_SPACING
    : notShardHeight;

  return [defaultCardWidth, height];
};

type LinkWidthMetadata = { isFirstVerticalHalf?: boolean };

const getLinkWidth = (
  sourceNode: ExplainTreeNodeData,
  targetNode: ExplainTreeNodeData,
  metaData?: LinkWidthMetadata
): number => {
  if (sourceNode.isShard || targetNode.isShard) {
    if (metaData?.isFirstVerticalHalf) {
      return spacing[4];
    }

    return spacing[2];
  }

  return spacing[1];
};

const getNodeKey = (node: ExplainTreeNodeData) => node.id;

const ExplainTree: React.FunctionComponent<ExplainTreeProps> = ({
  executionStats,
  scale,
}) => {
  const darkMode = useDarkMode();
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);

  const root = useMemo(
    () => executionStatsToTreeData(executionStats),
    [executionStats]
  );

  if (!root) return null;

  return (
    <TreeLayout<ExplainTreeNodeData, LinkWidthMetadata>
      data-testid="explain-tree"
      data={root}
      getNodeSize={getNodeSize}
      getNodeKey={getNodeKey}
      linkColor={darkMode ? palette.gray.dark2 : palette.gray.light2}
      arrowColor={darkMode ? palette.gray.base : palette.gray.light1}
      getLinkWidth={getLinkWidth}
      horizontalSpacing={TREE_HORIZONTAL_SPACING}
      verticalSpacing={TREE_VERTICAL_SPACING}
      className={explainTreeStyles}
      scale={scale}
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
