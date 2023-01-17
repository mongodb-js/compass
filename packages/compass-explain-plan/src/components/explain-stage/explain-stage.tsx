import {
  Badge,
  Button,
  Code,
  css,
  cx,
  KeylineCard,
  palette,
  rgba,
  spacing,
  Subtitle,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React, { useCallback, useMemo, useState } from 'react';
import { Clock } from './clock';

function drawArc({ startAngleDeg: number, endAngleDeg: number });

interface ExplainStageProps {
  name: string;
  nReturned: number;
  highlights: Record<string, string | boolean>;
  curStageExecTimeMS: number;
  prevStageExecTimeMS: number;
  totalExecTimeMS: number;
  isShard: boolean;
  details: Record<string, any>;
  x: number;
  y: number;
  xoffset: number;
  yoffset: number;
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
  toggleDetails: () => void;
  details: Record<string, any>;
  detailsOpen: boolean;
}

interface ExecutionstatsProps {
  nReturned: number;
  prevStageExecTimeMS: number;
  curStageExecTimeMS: number;
  totalExecTimeMS: number;
}

let zIndexCounter = 100;
function getNewZIndex() {
  return zIndexCounter++;
}

const cardStyles = css({
  position: 'absolute',
  width: '276px',
  padding: spacing[2],
});

const separatorStyles = css({
  borderTop: `1px solid ${palette.gray.light2}`,
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

const separatorStylesDark = css({
  borderColor: palette.gray.dark2,
});

const contentStyles = css({ position: 'relative' });
const clockStyles = css({
  position: 'absolute',
  top: -(12 + spacing[2]),
  right: -(30 + spacing[2]),
});

const codeStyles = css({
  marginTop: spacing[2],
});

const Separator = () => {
  const darkMode = useDarkMode();
  return (
    <div className={cx(separatorStyles, darkMode && separatorStylesDark)}></div>
  );
};

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
    <div
      className={css({
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      })}
    >
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
            prevStageExMillis={prevStageExecTimeMS}
            curStageExMillis={curStageExecTimeMS}
            totalExMillis={totalExecTimeMS}
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
      <Separator />

      <ExecutionStats
        nReturned={props.nReturned}
        prevStageExecTimeMS={props.prevStageExecTimeMS}
        curStageExecTimeMS={props.curStageExecTimeMS}
        totalExecTimeMS={props.totalExecTimeMS}
      ></ExecutionStats>

      {Object.entries(props.highlights).length > 0 && (
        <div>
          <Separator />
          <Highlights highlights={props.highlights}></Highlights>
        </div>
      )}
      <Separator />
      <Button
        type="button"
        size="xsmall"
        variant="default"
        onClick={() => props.toggleDetails()}
      >
        Details
      </Button>
      {props.detailsOpen && (
        <div className={codeStyles}>
          <Code copyable={false} language="json">
            {JSON.stringify(props.details, null, ' ') || '{}'}
          </Code>
        </div>
      )}
    </>
  );
};

const ExplainStage: React.FunctionComponent<ExplainStageProps> = ({
  name = '',
  nReturned = 0,
  isShard = false,
  totalExecTimeMS = 1,
  curStageExecTimeMS = 0,
  prevStageExecTimeMS = 0,
  x = 0,
  y = 0,
  xoffset = 0,
  yoffset = 0,
  highlights = {},
  details = {},
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const detailsButtonClicked = useCallback(() => {
    setDetailsOpen(!detailsOpen);
  }, [detailsOpen]);

  const dynamicContainerStyles = useMemo(() => {
    return css({
      zIndex: detailsOpen ? getNewZIndex() : 'initial',
      top: y + yoffset,
      left: x + xoffset,
      boxShadow: detailsOpen
        ? `0px 2px 4px -1px ${rgba(palette.black, 0.15)}`
        : '',
    });
  }, [detailsOpen, x, y, yoffset, xoffset]);

  return (
    <KeylineCard className={cx(cardStyles, dynamicContainerStyles)}>
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
            toggleDetails={detailsButtonClicked}
            detailsOpen={detailsOpen}
            details={details}
          />
        )}
      </div>
    </KeylineCard>
  );
};

export default ExplainStage;
