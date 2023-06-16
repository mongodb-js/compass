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
export const defaultCardHeight = 84;
export const shardCardHeight = 32;
export const highlightFieldHeight = 20;

interface ExecutionstatsProps {
  nReturned: number;
  prevStageExecTimeMS: number;
  curStageExecTimeMS: number;
  totalExecTimeMS: number;
}

// Instead of using CSS ellipsis which trims the text towards the end / front,
// we use this custom implementation to trim the text in middle because shard
// names could have similar text in the front and the differentiating numbers
// are generally available at the end of the name. For example: atlas-shard-0,
// atlas-shard-1, etc. The trimThreshold is taken from a hit and try approach to
// fit as many big chars as possible (worst case scenario) in the shard card
// because other sophisticated approaches require understanding font specifics
// like kerning, font-constant, etc to properly determine the width of character
// for a particular font.
export const trimInMiddle = (
  text: string,
  trimThreshold = 20,
  charsToKeepInFront = 6,
  charsToKeepInBack = 4
) => {
  if (text.length <= trimThreshold) {
    return text;
  }

  const charsBeforeEllipsis = text.substring(0, charsToKeepInFront);
  const remainingText = text.substring(charsToKeepInFront);
  const charsAfterEllipsis = remainingText.substring(
    remainingText.length - charsToKeepInBack
  );
  return `${charsBeforeEllipsis}…${charsAfterEllipsis}`;
};

export const milliSecondsToNormalisedValue = (
  ms: number
): { value: string; unit: 'h' | 'min' | 's' | 'ms' } => {
  const hasDecimalPoint = (n: number) => n - Math.floor(n) !== 0;
  const hours = ms / (1000 * 60 * 60);
  if (hours >= 1) {
    return {
      value: hasDecimalPoint(hours) ? hours.toFixed(1) : hours.toString(),
      unit: 'h',
    };
  }

  const minutes = ms / (1000 * 60);
  if (minutes >= 1) {
    return {
      value: hasDecimalPoint(minutes) ? minutes.toFixed(1) : minutes.toString(),
      unit: 'min',
    };
  }

  const seconds = ms / 1000;
  if (seconds >= 1) {
    return {
      value: hasDecimalPoint(seconds) ? seconds.toFixed(1) : seconds.toString(),
      unit: 's',
    };
  }

  return {
    value: ms.toString(),
    unit: 'ms',
  };
};

const cardStyles = css({
  position: 'absolute',
  width: defaultCardWidth,
  padding: '14px',
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
  top: -spacing[5],
  right: -(8 + spacing[5]),
});

const codeContainerStyles = css({
  marginTop: spacing[3],
  height: '100%',
  overflow: 'hidden',
});

const executionStatsStyle = css({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '1fr 110px',
  marginTop: '12px',
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
  height: spacing[5],
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const shardViewTextStyles = css({
  color: palette.gray.base,
  fontSize: '16px',
  fontWeight: 600,
  textAlign: 'center',
  overflow: 'hidden',
  textTransform: 'uppercase',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
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
    <KeylineCard className={shardViewContainerStyles} title={props.name}>
      <Body baseFontSize={16} className={shardViewTextStyles}>
        {trimInMiddle(props.name)}
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
                />
              </div>
            )}
          >
            The clock represents the total time the query took to complete. The
            blue clock segment is the time taken by the highlighted stage (
            {curStageExecTimeMS - prevStageExecTimeMS} ms). The gray clock
            segment is the time taken by preceding stages.
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
            readOnly={true}
            formattable={false}
            showLineNumbers={false}
            initialJSONFoldAll={false}
            showAnnotationsGutter={false}
            minLines={1}
            maxLines={15}
            text={JSON.stringify(props.details, null, ' ') || '{}'}
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
