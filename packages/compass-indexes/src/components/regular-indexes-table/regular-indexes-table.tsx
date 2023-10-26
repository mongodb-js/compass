import React, { useState } from 'react';
import { PieChart, Pie, Tooltip as RechartsTooltip } from 'recharts';
import { connect } from 'react-redux';
import {
  css,
  Button,
  Cell,
  Code,
  Icon,
  IndexKeysBadge,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Table,
  TableHeader,
  Tooltip,
  palette,
} from '@mongodb-js/compass-components';
import { withPreferences } from 'compass-preferences-model';

import type { RootState } from '../../modules';

import { IndexesTable } from '../indexes-table';

import TypeField from './type-field';
import SizeField, { formatSize } from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import IndexActions from './index-actions';

import type {
  AnalyzeShardKeyState,
  ShardDistributionState,
} from '../../modules/regular-indexes';
import {
  sortRegularIndexes,
  dropIndex,
  hideIndex,
  unhideIndex,
  shardOnAnalyzedIndex,
  analyzeShardKey,
  showShardDistribution,
} from '../../modules/regular-indexes';

import {
  type RegularIndex,
  type RegularSortColumn,
} from '../../modules/regular-indexes';

import type { SortDirection } from '../../modules';

type RegularIndexesTableProps = {
  indexes: RegularIndex[];
  serverVersion: string;
  analyzeShardKeyState: AnalyzeShardKeyState;
  shardDistributionState: ShardDistributionState;
  isSharded?: boolean;
  isWritable?: boolean;
  onHideIndex: (name: string) => void;
  onUnhideIndex: (name: string) => void;
  onSortTable: (column: RegularSortColumn, direction: SortDirection) => void;
  onDeleteIndex: (name: string) => void;
  onShardOnAnalyzedIndex: () => void;
  onAnalyzeShardKey: (key: Record<string, unknown>) => void;
  onShowShardDistribution: () => void;
  readOnly?: boolean;
  error?: string | null;
};

export const RegularIndexesTable: React.FunctionComponent<
  RegularIndexesTableProps
> = ({
  analyzeShardKeyState,
  shardDistributionState,
  isSharded,
  isWritable,
  readOnly,
  indexes,
  serverVersion,
  onHideIndex,
  onUnhideIndex,
  onSortTable,
  onDeleteIndex,
  onShardOnAnalyzedIndex,
  onAnalyzeShardKey,
  onShowShardDistribution,
  error,
}) => {
  const [shardKeyAnalysisModalVisible, setShardKeyAnalysisModalVisible] =
    useState(false);
  const [
    shardKeyDistributionModalVisible,
    setShardKeyDistributionModalVisible,
  ] = useState(false);

  if (error) {
    // We don't render the table if there is an error. The toolbar takes care of
    // displaying it.
    return null;
  }

  const canModifyIndex = isWritable && !readOnly;

  const columns = [
    'Name and Definition',
    'Type',
    'Size',
    'Usage',
    'Properties',
  ] as const;

  const data = indexes.map((index) => {
    return {
      key: index.name,
      'data-testid': `row-${index.name}`,
      fields: [
        {
          'data-testid': 'name-field',
          children: index.name,
        },
        {
          'data-testid': 'type-field',
          children: <TypeField type={index.type} extra={index.extra} />,
        },
        {
          'data-testid': 'size-field',
          children: (
            <SizeField size={index.size} relativeSize={index.relativeSize} />
          ),
        },
        {
          'data-testid': 'usage-field',
          children: (
            <UsageField usage={index.usageCount} since={index.usageSince} />
          ),
        },
        {
          'data-testid': 'property-field',
          children: (
            <PropertyField
              cardinality={index.cardinality}
              extra={index.extra}
              properties={index.properties}
            />
          ),
        },
      ],
      actions: index.name !== '_id_' && index.extra.status !== 'inprogress' && (
        <IndexActions
          collectionIsSharded={!!isSharded}
          index={index}
          serverVersion={serverVersion}
          onDeleteIndex={onDeleteIndex}
          onHideIndex={onHideIndex}
          onUnhideIndex={onUnhideIndex}
          onShardOnIndex={(key) => {
            onAnalyzeShardKey(key);
            setShardKeyAnalysisModalVisible(true);
          }}
          onShowShardDistribution={() => {
            onShowShardDistribution();
            setShardKeyDistributionModalVisible(true);
          }}
        ></IndexActions>
      ),
      details: (
        <IndexKeysBadge
          keys={index.fields}
          data-testid={`indexes-details-${index.name}`}
        />
      ),
    };
  });

  const keyCharacteristics: any =
    analyzeShardKeyState?.result?.keyCharacteristics;
  return (
    <>
      <IndexesTable
        data-testid="indexes"
        aria-label="Indexes"
        canModifyIndex={canModifyIndex}
        columns={columns}
        data={data}
        onSortTable={(column, direction) => onSortTable(column, direction)}
      />
      {analyzeShardKeyState.key && (
        <Modal
          open={shardKeyAnalysisModalVisible}
          setOpen={setShardKeyAnalysisModalVisible}
        >
          <ModalHeader title="Analyzing Shard Key" />
          <ModalBody>
            <div>
              Shard Key:{' '}
              <Code language="js">
                {JSON.stringify(analyzeShardKeyState.key)}
              </Code>
            </div>
            {analyzeShardKeyState.result ? (
              <div>
                <Table
                  data={[
                    {
                      numDocsSampled: keyCharacteristics.numDocsSampled,
                      numDistinctValues: keyCharacteristics.numDistinctValues,
                      isUnique: keyCharacteristics.isUnique,
                      monotonicity: keyCharacteristics.monotonicity?.type,
                    },
                  ]}
                  columns={[
                    <TableHeader
                      label="Documents sampled"
                      key="numDocsSampled"
                    />,
                    <TableHeader
                      label="Distinct values found"
                      key="numDistinctValues"
                    />,
                    <TableHeader label="Index is unique?" key="isUnique" />,
                    <TableHeader
                      label="Values are monotonic?"
                      key="monotonicity"
                    />,
                  ]}
                >
                  {({ datum: info, index }) => (
                    <Row key={index}>
                      <Cell>{info.numDocsSampled}</Cell>
                      <Cell>{info.numDistinctValues}</Cell>
                      <Cell>{info.isUnique ? 'Yes' : 'No'}</Cell>
                      <Cell>{info.monotonicity}</Cell>
                    </Row>
                  )}
                </Table>
              </div>
            ) : (
              <div>
                <Icon glyph="Ellipsis" />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShardKeyAnalysisModalVisible(false)}>
              Cancel
            </Button>
            <Button onClick={() => onShardOnAnalyzedIndex()} variant="primary">
              Confirm Sharding On This Index
            </Button>
          </ModalFooter>
        </Modal>
      )}
      <Modal
        open={shardKeyDistributionModalVisible}
        setOpen={setShardKeyDistributionModalVisible}
      >
        <ModalHeader title="Data distribution across shards" />
        <ModalBody>
          <div>
            Shard Key:{' '}
            <Code language="js">
              {JSON.stringify(
                indexes.find((ix) => ix.properties?.includes('shardKey'))?.key
              )}
            </Code>
          </div>
          {shardDistributionState.result ? (
            <ShardDistributionChart state={shardDistributionState.result} />
          ) : (
            <div>
              <Icon glyph="Ellipsis" />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={() => setShardKeyDistributionModalVisible(false)}
            variant="primary"
          >
            OK
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

function ShardDistributionChart({
  state: { collStats, chunks, shards },
}: {
  state: NonNullable<ShardDistributionState['result']>;
}) {
  const stats = collStats.map((cs) => {
    return {
      ...cs,
      sszLabel: `${cs.shard} (storage size)`,
      szLabel: `${cs.shard} (logical size)`,
      chkLabel: `${cs.shard} (chunks)`,
      chunks: chunks.filter((chk) => chk.shard === cs.shard).length,
      shardHost:
        shards.find((shd) => shd.shard === cs.shard)?.host ?? '<unknown>',
    };
  });

  const [activeShard, setActiveShard] = useState<number | undefined>(undefined);
  const rowMouseEnter = (ignored: unknown, ix: number) => {
    setActiveShard(ix);
  };
  const rowMouseLeave = () => {
    setActiveShard(undefined);
  };

  return (
    <>
      <div className={css({ marginLeft: '70px' })}>
        <PieChart width={300} height={300}>
          <Pie
            onMouseEnter={rowMouseEnter}
            onMouseLeave={rowMouseLeave}
            activeIndex={activeShard}
            innerRadius={10}
            outerRadius={70}
            data={stats}
            dataKey="storageSize"
            nameKey="sszLabel"
            fill={palette.green.dark1}
            paddingAngle={5}
          />
          <Pie
            onMouseEnter={rowMouseEnter}
            onMouseLeave={rowMouseLeave}
            activeIndex={activeShard}
            innerRadius={80}
            outerRadius={110}
            data={stats}
            dataKey="size"
            nameKey="szLabel"
            fill={palette.green.light1}
            paddingAngle={5}
          />
          <Pie
            onMouseEnter={rowMouseEnter}
            onMouseLeave={rowMouseLeave}
            activeIndex={activeShard}
            innerRadius={120}
            outerRadius={140}
            data={stats}
            dataKey="chunks"
            nameKey="chkLabel"
            fill={palette.blue.light1}
            paddingAngle={5}
          />
          <RechartsTooltip isAnimationActive={false} />
        </PieChart>
      </div>
      <Table
        data={stats}
        columns={[
          <TableHeader label="Shard name" key="shard" />,
          <TableHeader label="Shard host" key="shardHost" />,
          <TableHeader label="Storage size" key="storageSize" />,
          <TableHeader label="Logical size" key="size" />,
          <TableHeader label="# Chunks" key="chunks" />,
        ]}
      >
        {({ datum: info, index }) => (
          <Row
            key={index}
            onMouseEnter={() => rowMouseEnter(info, index)}
            onMouseLeave={() => rowMouseLeave()}
            className={css(
              index === activeShard && {
                backgroundColor: palette.blue.light3,
              }
            )}
          >
            <Cell>
              <MaybeTruncate text={info.shard} />
            </Cell>
            <Cell>
              <MaybeTruncate text={info.shardHost} />
            </Cell>
            <Cell>{formatSize(info.storageSize)}</Cell>
            <Cell>{formatSize(info.size)}</Cell>
            <Cell>{info.chunks}</Cell>
          </Row>
        )}
      </Table>
    </>
  );
}

function MaybeTruncate({ text, limit = 20 }: { text: string; limit?: number }) {
  const display = text.length > limit ? text.slice(0, limit - 1) + ' …' : text;
  return (
    <Tooltip
      trigger={({ children, ...props }) => (
        <span {...props}>
          {display}
          {children}
        </span>
      )}
    >
      {text}
    </Tooltip>
  );
}

const mapState = ({
  serverVersion,
  regularIndexes,
  isWritable,
  isSharded,
}: RootState) => ({
  isWritable,
  isSharded,
  serverVersion,
  analyzeShardKeyState: regularIndexes.analyzeShardKeyState,
  shardDistributionState: regularIndexes.shardDistributionState,
  indexes: regularIndexes.indexes,
  error: regularIndexes.error,
});

const mapDispatch = {
  onDeleteIndex: dropIndex,
  onHideIndex: hideIndex,
  onUnhideIndex: unhideIndex,
  onSortTable: sortRegularIndexes,
  onShardOnAnalyzedIndex: shardOnAnalyzedIndex,
  onAnalyzeShardKey: analyzeShardKey,
  onShowShardDistribution: showShardDistribution,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(RegularIndexesTable, ['readOnly'], React));
