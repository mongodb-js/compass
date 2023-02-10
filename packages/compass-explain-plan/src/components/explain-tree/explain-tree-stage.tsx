import React from 'react';
import {
  Badge,
  Button,
  Code,
  css,
  KeylineCard,
  palette,
  rgba,
  spacing,
  Subtitle,
  HorizontalRule,
} from '@mongodb-js/compass-components';

import { Clock } from './clock';

interface ExplainTreeStageProps {
  name: string;
  nReturned: number;
  highlights: Record<string, string | boolean>;
  curStageExecTimeMS: number;
  prevStageExecTimeMS: number;
  totalExecTimeMS: number;
  isShard: boolean;
  details: Record<string, unknown>;
  detailsOpen: boolean;
  onToggleDetailsClick: () => void;
}

interface ShardViewProps {
  name: string;
}

interface StageViewProps {
  name: string;
  nReturned: number;
  highlights: Record<string, string | boolean>;
  curStageExecTimeMS: number;
  prevStageExecTimeMS: number;
  totalExecTimeMS: number;
  onToggleDetailsClick: () => void;
  details: Record<string, unknown>;
  detailsOpen: boolean;
}

// NOTE: these values are used to layout the tree and must match
// the actual size of the elements.
export const defaultCardWidth = 264;
export const defaultCardHeight = 118;
export const shardCardHeight = 42;
export const highlightFieldHeight = 36;

interface ExecutionstatsProps {
  nReturned: number;
  prevStageExecTimeMS: number;
  curStageExecTimeMS: number;
  totalExecTimeMS: number;
}

const cardStyles = css({
  position: 'absolute',
  width: defaultCardWidth,
  padding: spacing[2],
});

const separatorStyles = css({
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

const contentStyles = css({ position: 'relative' });
const clockStyles = css({
  position: 'absolute',
  top: -(12 + spacing[2]),
  right: -(30 + spacing[2]),
});

const codeContainerStyles = css({
  marginTop: spacing[2],
});

const codeStyles = css({
  maxHeight: spacing[5] * 10,
  overflow: 'scroll',
});

const executionStatsStyle = css({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
});

const ShardView: React.FunctionComponent<ShardViewProps> = (props) => {
  return <Subtitle>{props.name}</Subtitle>;
};

const Highlights: React.FunctionComponent<{
  highlights: Record<string, boolean | string>;
}> = ({ highlights }) => {
  return (
    <ul>
      {Object.entries(highlights).map(([key, value], index) => (
        <li key={index}>
          <span>{key}: </span>
          <strong>
            {typeof value === 'boolean' ? (value ? 'yes' : 'no') : value}
          </strong>
        </li>
      ))}
    </ul>
  );
};

const ExecutionStats: React.FunctionComponent<ExecutionstatsProps> = ({
  nReturned,
  prevStageExecTimeMS,
  curStageExecTimeMS,
  totalExecTimeMS,
}) => {
  return (
    <div className={executionStatsStyle}>
      <div>
        <span>nReturned </span>
        <span>
          <Badge>{nReturned}</Badge>
        </span>
      </div>
      <div>
        <span>Execution Time</span>
        <span>
          <Clock
            prevStageExecTimeMS={prevStageExecTimeMS}
            curStageExecTimeMS={curStageExecTimeMS}
            totalExecTimeMS={totalExecTimeMS}
            width={60}
            height={60}
            className={clockStyles}
          />
        </span>
      </div>
    </div>
  );
};

const StageView: React.FunctionComponent<StageViewProps> = (props) => {
  return (
    <>
      <Subtitle>{props.name}</Subtitle>
      <HorizontalRule className={separatorStyles} />

      <ExecutionStats
        nReturned={props.nReturned}
        prevStageExecTimeMS={props.prevStageExecTimeMS}
        curStageExecTimeMS={props.curStageExecTimeMS}
        totalExecTimeMS={props.totalExecTimeMS}
      ></ExecutionStats>

      {Object.entries(props.highlights).length > 0 && (
        <div>
          <HorizontalRule className={separatorStyles} />
          <Highlights highlights={props.highlights}></Highlights>
        </div>
      )}
      <HorizontalRule className={separatorStyles} />
      <Button
        type="button"
        size="xsmall"
        variant="default"
        onClick={() => props.onToggleDetailsClick()}
      >
        Details
      </Button>
      {props.detailsOpen && (
        <div className={codeContainerStyles}>
          <Code copyable={false} language="json" className={codeStyles}>
            {JSON.stringify(props.details, null, ' ') || '{}'}
          </Code>
        </div>
      )}
    </>
  );
};

const ExplainTreeStage: React.FunctionComponent<ExplainTreeStageProps> = ({
  name = '',
  nReturned = 0,
  isShard = false,
  totalExecTimeMS = 1,
  curStageExecTimeMS = 0,
  prevStageExecTimeMS = 0,
  highlights = {},
  details = {},
  detailsOpen = false,
  onToggleDetailsClick = () => undefined,
}) => {
  return (
    <KeylineCard
      data-testid="explain-stage"
      className={cardStyles}
      style={{
        boxShadow: detailsOpen
          ? `0px 2px 4px -1px ${rgba(palette.black, 0.15)}`
          : '',
      }}
    >
      <div className={contentStyles}>
        {isShard ? (
          <ShardView name={name} />
        ) : (
          <StageView
            name={name}
            nReturned={nReturned}
            highlights={highlights}
            curStageExecTimeMS={curStageExecTimeMS}
            prevStageExecTimeMS={prevStageExecTimeMS}
            totalExecTimeMS={totalExecTimeMS}
            onToggleDetailsClick={onToggleDetailsClick}
            detailsOpen={detailsOpen}
            details={details}
          />
        )}
      </div>
    </KeylineCard>
  );
};

export { ExplainTreeStage };
