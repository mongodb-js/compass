import React from 'react';
import {
  Badge,
  Code,
  css,
  KeylineCard,
  palette,
  rgba,
  spacing,
  Subtitle,
  HorizontalRule,
  Icon,
  Tooltip,
  cx,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

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
export const defaultCardWidth = 278;
export const defaultCardHeight = 94;
export const shardCardHeight = 58;
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
  padding: spacing[3],
});

const cardStylesDarkMode = css({
  borderColor: palette.gray.light2,
});

const stageTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  cursor: 'pointer',
});

const separatorStyles = css({
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

const contentStyles = css({ position: 'relative' });
const clockStyles = css({
  position: 'absolute',
  top: -(8 + spacing[5]),
  right: -(30 + spacing[3]),
});

const codeContainerStyles = css({
  marginTop: spacing[3],
  height: '100%',
  overflow: 'hidden',
});

const executionStatsStyle = css({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  marginTop: spacing[3],
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
  const deltaExecTime = curStageExecTimeMS - prevStageExecTimeMS;
  const deltaExecPercent = ((deltaExecTime / totalExecTimeMS) * 100).toFixed(2);
  return (
    <div className={executionStatsStyle}>
      <div>
        <span>Returned </span>
        <span>
          <Badge variant="blue">{nReturned}</Badge>
        </span>
      </div>
      <div>
        <span>Execution Time</span>
        <span>
          <Tooltip
            align="top"
            justify="middle"
            trigger={({ children, ...props }) => (
              <div {...props} className={clockStyles}>
                {children}
                <Clock
                  prevStageExecTimeMS={prevStageExecTimeMS}
                  curStageExecTimeMS={curStageExecTimeMS}
                  totalExecTimeMS={totalExecTimeMS}
                  width={60}
                  height={60}
                />
              </div>
            )}
          >
            Clock represents the total time taken by the query. The blue arc,
            which begins at the end of the previous stage, represents the
            percentage of time spent on the execution of the hovered stage. In
            this case it is {deltaExecTime === 0 ? 0 : deltaExecPercent}%
          </Tooltip>
        </span>
      </div>
    </div>
  );
};

const StageView: React.FunctionComponent<StageViewProps> = (props) => {
  return (
    <>
      <div className={stageTitleStyles}>
        <Icon glyph={props.detailsOpen ? 'ChevronDown' : 'ChevronRight'} />
        <Subtitle>{props.name}</Subtitle>
      </div>

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

      {props.detailsOpen && (
        <KeylineCard
          className={codeContainerStyles}
          onClick={(e) => e.stopPropagation()}
        >
          <CodemirrorMultilineEditor
            language="json"
            text={JSON.stringify(props.details, null, ' ') || '{}'}
            readOnly={true}
            showAnnotationsGutter={false}
            showLineNumbers={false}
            formattable={false}
            initialJSONFoldAll={false}
            maxLines={15}
            data-testid="explain-stage-details"
          />
        </KeylineCard>
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
  const isDarkMode = useDarkMode();
  return (
    <KeylineCard
      onClick={() => {
        if (!isShard) {
          onToggleDetailsClick();
        }
      }}
      data-testid="explain-stage"
      className={cx(cardStyles, {
        [cardStylesDarkMode]: isDarkMode,
      })}
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
