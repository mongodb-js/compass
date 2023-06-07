import React from 'react';
import {
  css,
  KeylineCard,
  palette,
  spacing,
  Subtitle,
  HorizontalRule,
  Icon,
  Tooltip,
  cx,
  useDarkMode,
  Card,
  Body,
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
export const shardCardHeight = 46;
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
  borderRadius: spacing[2],
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
  alignItems: 'center',
});

const statsBadgeCircle = css({
  display: 'inline-block',
  width: spacing[4] - 4,
  height: spacing[4] - 4,
  lineHeight: `${spacing[4] - 4}px`,
  borderRadius: '100px',
  textAlign: 'center',
  fontWeight: 700,

  backgroundColor: palette.blue.base,
  color: palette.white,
});

const statsBadgeOval = css({
  width: 'auto',
  padding: `0 ${spacing[2]}px`,
});

const statsBadgeColorDark = css({
  backgroundColor: palette.blue.light2,
  color: palette.black,
});

const shardViewContainerStyles = css({
  borderRadius: 0,
  borderColor: palette.gray.base,
  width: defaultCardWidth,
  padding: `${spacing[2]}px`,
  textAlign: 'center',
});

const shardViewTextStyles = css({
  color: palette.gray.base,
  fontSize: '16px',
  fontWeight: 600,
});

const StatsBadge: React.FunctionComponent<{
  stats: number | string;
}> = ({ stats }) => {
  const darkMode = useDarkMode();
  return (
    <span
      className={cx(statsBadgeCircle, {
        [statsBadgeOval]: String(stats).length > 1,
        [statsBadgeColorDark]: darkMode,
      })}
    >
      {stats}
    </span>
  );
};

const ShardView: React.FunctionComponent<ShardViewProps> = (props) => {
  return (
    <KeylineCard className={shardViewContainerStyles}>
      <Body baseFontSize={16} className={shardViewTextStyles}>
        {props.name}
      </Body>
    </KeylineCard>
  );
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
        <span>Returned </span>
        <StatsBadge stats={nReturned} />
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
            Clock represents the total time taken by the query. Thick blue arc
            is the time taken by the highlighted stage and the thick gray arc is
            the time taken by the stages before.
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
      />

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
  if (isShard) {
    return <ShardView name={name} />;
  }

  return (
    <Card
      data-testid="explain-stage"
      className={cx(cardStyles, {
        [cardStylesDarkMode]: isDarkMode,
      })}
      style={{ boxShadow: !detailsOpen ? 'none' : undefined }}
      onClick={onToggleDetailsClick}
    >
      <div className={contentStyles}>
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
      </div>
    </Card>
  );
};

export { ExplainTreeStage };
