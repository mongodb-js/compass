import React, { useCallback, useMemo, useState } from 'react';
import type { SummaryTable } from '../analysis/generate-summary-table';
import generateSummaryTable from '../analysis/generate-summary-table';
import ProfilerFlamegraph from './profiler-flamegraph';
import { type Document } from 'bson';
import {
  Button,
  Card,
  Icon,
  Link,
  css,
  spacing,
  palette,
  Code,
  Badge,
  SegmentedControl,
  SegmentedControlOption,
  IconButton,
  Subtitle,
} from '@mongodb-js/compass-components';
import { SideNav } from '@mongodb-js/compass-components';
import { SideNavGroup } from '@mongodb-js/compass-components';
import { SideNavItem } from '@mongodb-js/compass-components';
import generateGlobalStats from '../analysis/generate-global-stats';
import { useSelector } from 'react-redux';
import { RootState } from '../modules';
import {
  Hint,
  generateGlobalHints,
  generateHints,
} from '../analysis/generate-hints';
import { toJSString } from 'mongodb-query-parser';
import Color from 'colorjs.io';

const hintStyles = (baseColor: string) =>
  css({
    backgroundColor: baseColor,
    padding: spacing[2],
    margin: 0,
  });

const hintAfterIconStyles = css({
  marginRight: spacing[2],
});

const pageAlignmentStyles = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[4],
  gap: spacing[4],
  width: '100%',
  height: '100%',
});

const topToolbarStyles = css({
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'row-reverse',
  gap: spacing[1],
});

const mainSectionStyles = css({
  display: 'flex',
  flexDirection: 'row',
  flexGrow: 1,
  gap: spacing[6],
});

const queryShapeDetailStyles = css({
  flexGrow: 1,
  width: '60%',
  display: 'flex',
  flexDirection: 'column',
  alignContent: 'center',
  justifyContent: 'start',
  gap: spacing[2],
  overflowY: 'auto',
});

const globalStatsStyles = css({
  flexGrow: 0,
  width: '12vw',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const footerSectionStyles = css({
  flexGrow: 0,
  width: '100%',
  alignSelf: 'end',
  maxHeight: '200px',
});

const codeEditorFullSizeStyles = css({
  flexGrow: 1,
});

type StatCardProps = {
  name: string;
  value: number;
  reverse: boolean;
};

const STAT_CARD_START_COLOR = new Color('#01AA14');
const STAT_CARD_END_COLOR = new Color('#A10000');

const StatCard: React.FunctionComponent<StatCardProps> = ({
  name,
  value,
  reverse,
}) => {
  const [start, end] = reverse
    ? [STAT_CARD_START_COLOR, STAT_CARD_END_COLOR]
    : [STAT_CARD_END_COLOR, STAT_CARD_START_COLOR];
  const rangeVal = Math.min(100, value) / 100;
  const range = start.mix(end, rangeVal);

  const color = range.toString({ format: 'hex' });
  const bgColor = new Color('#ffffff')
    .mix(color, 0.05)
    .toString({ format: 'hex' });

  return (
    <Card className={css({ backgroundColor: bgColor, textAlign: 'center' })}>
      <b className={css({ textAlign: 'center', wordWrap: 'break-word' })}>
        {name}
      </b>
      <Subtitle className={css({ textAlign: 'center', color })}>
        {value}%
      </Subtitle>
    </Card>
  );
};

type ProfileSummaryTableProps = {
  table: SummaryTable;
  queryShape?: string;
  onShapeChoosen: (shape: string) => void;
  onShapeClear: () => void;
};

const ProfileSummaryTable: React.FunctionComponent<
  ProfileSummaryTableProps
> = ({ table, queryShape, onShapeChoosen, onShapeClear }) => {
  const toggleActive = useCallback(
    (id: string) => {
      if (queryShape === id) {
        onShapeClear();
      } else {
        onShapeChoosen(id);
      }
    },
    [queryShape, onShapeChoosen, onShapeClear]
  );

  return (
    <SideNav title="Queries">
      {table.map((group) => {
        return (
          <SideNavGroup
            key={group.namespace}
            header={`${group.namespace} Queries`}
          >
            {group.items.map((item) => (
              <SideNavItem
                active={item.queryShape === queryShape}
                key={item.queryShape}
                onClick={() => toggleActive(item.queryShape)}
              >
                <Badge variant="blue">$find</Badge>
                {item.queryFields.map((field) => (
                  <Badge key={field} variant="lightgray">
                    {field}
                  </Badge>
                ))}
              </SideNavItem>
            ))}
          </SideNavGroup>
        );
      })}{' '}
    </SideNav>
  );
};

type ProfilerSummaryProps = {
  onClearProfiler: () => void;
  profiledQueries: Document[];
};

type HintResultProps = { hint: Hint; onClick?: (hint: Hint) => void };
const HintResult: React.FunctionComponent<HintResultProps> = ({
  hint,
  onClick,
}) => {
  const onClickWrapper = useCallback(() => {
    onClick?.(hint);
  }, [onClick, hint]);

  if (onClick) {
    switch (hint.type) {
      case 'success':
        return (
          <div className={hintStyles(palette.green.light3)}>
            <IconButton
              className={hintAfterIconStyles}
              onClick={onClickWrapper}
            >
              <Icon color={palette.green.dark1} glyph="MagnifyingGlass" />
            </IconButton>
            <span>{hint.description}</span>
            {hint.moreInfoUrl && <Link href={hint.moreInfoUrl}></Link>}
            {hint.attachedCode && (
              <Code language="javascript">{hint.attachedCode}</Code>
            )}
          </div>
        );
      case 'warning':
        return (
          <div className={hintStyles(palette.yellow.light2)}>
            <IconButton
              className={hintAfterIconStyles}
              onClick={onClickWrapper}
            >
              <Icon color={palette.yellow.dark2} glyph="MagnifyingGlass" />
            </IconButton>
            <span>{hint.description}</span>
            {hint.moreInfoUrl && <Link href={hint.moreInfoUrl}></Link>}
            {hint.attachedCode && (
              <Code language="javascript">{hint.attachedCode}</Code>
            )}
          </div>
        );
      case 'error':
        return (
          <div className={hintStyles(palette.red.light3)}>
            <IconButton
              className={hintAfterIconStyles}
              onClick={onClickWrapper}
            >
              <Icon color={palette.red.dark2} glyph="MagnifyingGlass" />
            </IconButton>
            <span>{hint.description}</span>
            {hint.moreInfoUrl && <Link href={hint.moreInfoUrl}></Link>}
            {hint.attachedCode && (
              <Code language="javascript">{hint.attachedCode}</Code>
            )}
          </div>
        );
      case 'info':
        return (
          <div className={hintStyles(palette.blue.light3)}>
            <IconButton
              className={hintAfterIconStyles}
              onClick={onClickWrapper}
            >
              <Icon color={palette.blue.dark2} glyph="MagnifyingGlass" />
            </IconButton>
            <span>{hint.description}</span>
            {hint.moreInfoUrl && <Link href={hint.moreInfoUrl}></Link>}
            {hint.attachedCode && (
              <Code language="javascript">{hint.attachedCode}</Code>
            )}
          </div>
        );
    }
  } else {
    switch (hint.type) {
      case 'success':
        return (
          <div className={hintStyles(palette.green.light3)}>
            <Icon
              className={hintAfterIconStyles}
              color={palette.green.dark1}
              glyph="CheckmarkWithCircle"
            />
            <span>{hint.description}</span>
            {hint.moreInfoUrl && <Link href={hint.moreInfoUrl}></Link>}
            {hint.attachedCode && (
              <Code language="javascript">{hint.attachedCode}</Code>
            )}
          </div>
        );
      case 'warning':
        return (
          <div className={hintStyles(palette.yellow.light2)}>
            <Icon
              className={hintAfterIconStyles}
              color={palette.yellow.dark2}
              glyph="Warning"
            />
            <span>{hint.description}</span>
            {hint.moreInfoUrl && <Link href={hint.moreInfoUrl}></Link>}
            {hint.attachedCode && (
              <Code language="javascript">{hint.attachedCode}</Code>
            )}
          </div>
        );
      case 'error':
        return (
          <div className={hintStyles(palette.red.light3)}>
            <Icon
              className={hintAfterIconStyles}
              color={palette.red.dark2}
              glyph="XWithCircle"
            />
            <span>{hint.description}</span>
            {hint.moreInfoUrl && <Link href={hint.moreInfoUrl}></Link>}
            {hint.attachedCode && (
              <Code language="javascript">{hint.attachedCode}</Code>
            )}
          </div>
        );
      case 'info':
        return (
          <div className={hintStyles(palette.blue.light3)}>
            <Icon
              className={hintAfterIconStyles}
              color={palette.blue.dark2}
              glyph="InfoWithCircle"
            />
            <span>{hint.description}</span>
            {hint.moreInfoUrl && <Link href={hint.moreInfoUrl}></Link>}
            {hint.attachedCode && (
              <Code language="javascript">{hint.attachedCode}</Code>
            )}
          </div>
        );
    }
  }
};

const ProfilerSummary: React.FunctionComponent<ProfilerSummaryProps> = ({
  onClearProfiler,
  profiledQueries,
}) => {
  const wtCache = useSelector<RootState, number>(
    (state) => state.profilerState.wiredTigerCache || 256000000
  );
  const [currentView, setCurrentView] = useState<'hint' | 'deep'>('hint');

  const [shapeFilter, setShapeFilter] = useState<string | undefined>(undefined);
  const summary = useMemo(
    () => generateSummaryTable(profiledQueries),
    [profiledQueries]
  );
  const globalStats = useMemo(
    () => generateGlobalStats(profiledQueries, wtCache),
    [profiledQueries, wtCache]
  );
  const queryShapeGlobalStats = useMemo(
    () => generateGlobalStats(profiledQueries, wtCache, shapeFilter),
    [profiledQueries, wtCache, shapeFilter]
  );
  const globalQueryHints = useMemo(
    () => generateGlobalHints(profiledQueries),
    [profiledQueries]
  );

  const flamegraphData = useMemo(() => {
    if (shapeFilter === undefined) {
      return profiledQueries;
    }

    return profiledQueries.filter((e) => e.queryHash === shapeFilter);
  }, [profiledQueries, shapeFilter]);

  const queryToHint = useMemo(() => {
    if (flamegraphData.length > 0 && shapeFilter) {
      return flamegraphData[0];
    }

    return undefined;
  }, [flamegraphData, shapeFilter]);

  const hints = useMemo(() => {
    return queryToHint
      ? generateHints(queryToHint, wtCache, globalStats.totalTime)
      : [];
  }, [queryToHint, globalStats, wtCache]);

  const querySample = useMemo(() => {
    if (!queryToHint) {
      return undefined;
    }

    return toJSString(queryToHint.command.filter, 1)?.replaceAll('\n', '');
  }, [queryToHint]);

  const clearShapeFilter = () => setShapeFilter(undefined);
  return (
    <div className={pageAlignmentStyles}>
      <div className={topToolbarStyles}>
        <Button variant="danger" onClick={onClearProfiler}>
          Close Profiler
        </Button>
        <div className={codeEditorFullSizeStyles}>
          <Code language="javascript" copyable={true} showWindowChrome={false}>
            {shapeFilter
              ? querySample
              : '// Choose a query from the flamegraph or the side bar.'}
          </Code>
        </div>
      </div>
      <div className={mainSectionStyles}>
        <ProfileSummaryTable
          table={summary}
          queryShape={shapeFilter}
          onShapeChoosen={setShapeFilter}
          onShapeClear={clearShapeFilter}
        />
        <div className={queryShapeDetailStyles}>
          <div className={topToolbarStyles}>
            <SegmentedControl
              size="small"
              value={currentView}
              onChange={(view) => {
                if (view === 'back') {
                  setShapeFilter(undefined);
                  setCurrentView('hint');
                } else {
                  setCurrentView(view as any);
                }
              }}
            >
              <SegmentedControlOption value="hint">
                HINTS
              </SegmentedControlOption>
              <SegmentedControlOption value="deep">
                DETAILS
              </SegmentedControlOption>
            </SegmentedControl>
            <IconButton
              onClick={() => setShapeFilter(undefined)}
              title="View Global Stats"
            >
              <Icon glyph="NoFilter" size="small"></Icon>
            </IconButton>
          </div>
          <div
            className={css({
              overflowY: 'scroll',
              height: '55vh',
              maxHeight: '55vh',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[2],
            })}
          >
            {currentView === 'hint' &&
              shapeFilter &&
              hints.map((h, i) => <HintResult key={i} hint={h} />)}
            {currentView === 'hint' &&
              !shapeFilter &&
              globalQueryHints.map((h, i) => (
                <HintResult
                  onClick={(hint) => setShapeFilter(hint.queryShape)}
                  key={i}
                  hint={h}
                />
              ))}
            {currentView === 'deep' && (
              <Code
                language="javascript"
                copyable={true}
                showWindowChrome={false}
                chromeTitle={queryToHint?.ns || ''}
                showLineNumbers={true}
                className={css({ maxHeight: '480px' })}
              >
                {shapeFilter
                  ? toJSString(queryToHint, 2)
                  : '// Choose a query from the flamegraph or the side bar.'}
              </Code>
            )}
          </div>
        </div>
        <div className={globalStatsStyles}>
          <Subtitle className={css({ textAlign: 'center' })}>
            Resource Usage
          </Subtitle>
          <StatCard
            name="Cache Efficiency"
            reverse={false}
            value={
              Math.round(queryShapeGlobalStats.cacheEfficiency * 100) / 100
            }
          />
          {queryShapeGlobalStats && (
            <StatCard
              name="CPU Time %"
              reverse={true}
              value={
                Math.round(queryShapeGlobalStats.cpuTimePercentage! * 100) / 100
              }
            />
          )}
          <StatCard
            name="Index Accuracy"
            reverse={false}
            value={Math.round(queryShapeGlobalStats.indexAccuracy * 100) / 100}
          />
          <StatCard
            name="Time On Disk"
            reverse={true}
            value={
              Math.round(queryShapeGlobalStats.timeSpentOnDisk * 100) / 100
            }
          />
        </div>
      </div>
      <div className={footerSectionStyles}>
        <ProfilerFlamegraph
          profilingData={flamegraphData}
          onQueryShapeChoosen={setShapeFilter}
        />
      </div>
    </div>
  );
};

export default ProfilerSummary;
