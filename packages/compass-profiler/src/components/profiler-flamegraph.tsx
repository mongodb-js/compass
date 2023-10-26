import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlameGraph } from 'react-flame-graph';
import Color from 'colorjs.io';
import { type Document } from 'bson';
import { css, rafraf } from '@mongodb-js/compass-components';
import { toJSString } from 'mongodb-query-parser';

type FlameGraphNode = {
  name: string;
  value: number;
  tooltip: string;
  backgroundColor?: string;
  color?: string;
  children: FlameGraphNode[];
  queryShape: string;
};

const DANGER_START_COLOR = new Color('#A10000');
const DANGER_END_COLOR = new Color('#F94444');

const WARN_START_COLOR = new Color('#FF8E00');
const WARN_END_COLOR = new Color('#FFE400');

const OK_START_COLOR = new Color('#01AA14');
const OK_END_COLOR = new Color('#32FF49');

function clampColor(
  start: Color,
  end: Color,
  max: number,
  value: number
): string {
  const rangeVal = Math.min(max, value) / max;
  const range = end.mix(start, rangeVal);
  return range.toString({ format: 'hex' });
}

function serializeInputStage(
  inputStage: Document,
  totalExecution: number,
  startColor: Color,
  endColor: Color,
  queryShape: string
): FlameGraphNode {
  const children = [];

  if (inputStage.thenStage) {
    children.push(
      serializeInputStage(
        inputStage.thenStage,
        totalExecution,
        startColor,
        endColor,
        queryShape
      )
    );
  }

  if (inputStage.elseStage) {
    children.push(
      serializeInputStage(
        inputStage.elseStage,
        totalExecution,
        startColor,
        endColor,
        queryShape
      )
    );
  }

  if (inputStage.inputStage) {
    children.push(
      serializeInputStage(
        inputStage.inputStage,
        totalExecution,
        startColor,
        endColor,
        queryShape
      )
    );
  }

  if (inputStage.innerStage) {
    children.push(
      serializeInputStage(
        inputStage.innerStage,
        totalExecution,
        startColor,
        endColor,
        queryShape
      )
    );
  }

  if (inputStage.outerStage) {
    children.push(
      serializeInputStage(
        inputStage.outerStage,
        totalExecution,
        startColor,
        endColor,
        queryShape
      )
    );
  }

  return {
    name: inputStage.stage,
    value: Math.max(inputStage.executionTimeMillisEstimate, 1),
    tooltip: '',
    color: 'black',
    backgroundColor: clampColor(
      startColor,
      endColor,
      totalExecution,
      inputStage.executionTimeMillisEstimate
    ),
    children,
    queryShape,
  };
}

function serializeProfilingDataForQuery(
  profilingDatum: Document
): FlameGraphNode {
  let start: Color;
  let end: Color;

  if (profilingDatum.planSummary === 'COLLSCAN') {
    start = DANGER_START_COLOR;
    end = DANGER_END_COLOR;
  } else if (profilingDatum.keysExamined / profilingDatum.nreturned > 10) {
    start = WARN_START_COLOR;
    end = WARN_END_COLOR;
  } else {
    start = OK_START_COLOR;
    end = OK_END_COLOR;
  }
  const queryRoot = {
    name: `${profilingDatum.command.$db}.${
      profilingDatum.command.find
    } ${toJSString(profilingDatum.command.filter)}`,
    value: Math.max(profilingDatum.millis, 1),
    backgroundColor: start.toString({ format: 'hex' }),
    children: [
      serializeInputStage(
        profilingDatum.execStats,
        Math.max(profilingDatum.millis, 1),
        start,
        end,
        profilingDatum.queryHash
      ),
    ],
    queryShape: profilingDatum.queryHash,
  };

  return queryRoot;
}

export type ProfilerFlameGraphProps = {
  profilingData: Document[];
  onQueryShapeChoosen: (queryShape?: string) => void;
};

const ProfilerFlameGraph: React.FunctionComponent<ProfilerFlameGraphProps> = ({
  profilingData,
  onQueryShapeChoosen,
}) => {
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(800);

  const data = useMemo(() => {
    const maxTime = Math.max(
      profilingData.map((e) => e.millis || 0).reduce((a, b) => a + b, 0),
      profilingData.length
    );
    const children = profilingData.map(serializeProfilingDataForQuery);

    return {
      name: 'Profiling Session',
      value: maxTime,
      children,
    };
  }, [profilingData]);

  const div = useCallback((node) => {
    if (node !== null) {
      rafraf(() => {
        setWidth(node.getBoundingClientRect().width);
        setHeight(Math.max(node.getBoundingClientRect().height, 200));
      });
    }
  }, []);

  if (profilingData.length === 0) {
    return <div></div>;
  }

  return (
    <div ref={div} className={css({ borderTop: '6px solid gray' })}>
      <FlameGraph
        data={data}
        height={height}
        width={width}
        onChange={(node?: any) => {
          onQueryShapeChoosen(node?.source?.queryShape);
        }}
      />
    </div>
  );
};

export default ProfilerFlameGraph;
