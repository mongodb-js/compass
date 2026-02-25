import React, { useMemo } from 'react';
import { IndexKeysBadge } from '@mongodb-js/compass-components';
import type { LGTableDataType } from '@mongodb-js/compass-components';

import type {
  RegularIndex,
  InProgressIndex,
  RollingIndex,
} from '../../modules/regular-indexes';

import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import StatusField from './status-field';
import IndexActions from './index-actions';

// compassIndexType because type is taken by RegularIndex. indexType is taken by AtlasIndexStats.
type MappedRegularIndex = RegularIndex & { compassIndexType: 'regular-index' };
type MappedInProgressIndex = InProgressIndex & {
  compassIndexType: 'in-progress-index';
};
type MappedRollingIndex = RollingIndex & {
  compassIndexType: 'rolling-index';
  fields: RegularIndex['fields'];
};

export type MergedIndex =
  | MappedRegularIndex
  | MappedInProgressIndex
  | MappedRollingIndex;

export type IndexInfo = {
  id: string;
  name: string;
  indexInfo: MergedIndex;
  type: React.ReactNode;
  size: React.ReactNode;
  usageCount: React.ReactNode;
  properties: React.ReactNode;
  status: React.ReactNode;
  actions: undefined | React.ReactNode;
  renderExpandedContent: React.ReactNode;
};

type CommonIndexInfo = Omit<IndexInfo, 'renderExpandedContent'>;

/**
 * Determines the display status for a regular index based on its build progress
 */
export function determineRegularIndexStatus(
  index: RegularIndex
): 'inprogress' | 'ready' {
  // Build progress determines building vs ready
  if (index.buildProgress > 0 && index.buildProgress < 1) {
    return 'inprogress';
  }

  // Default to ready for completed indexes (buildProgress = 0 or 1)
  return 'ready';
}

export function mergeIndexes(
  indexes: RegularIndex[],
  inProgressIndexes: InProgressIndex[],
  rollingIndexes: RollingIndex[]
): MergedIndex[] {
  const rollingIndexNames = new Set(
    rollingIndexes.map((index) => index.indexName)
  );

  const mappedIndexes: MappedRegularIndex[] = indexes
    // exclude partially-built indexes so that we don't include indexes that
    // only exist on the primary node and then duplicate those as rolling
    // builds in the same table
    .filter((index) => !rollingIndexNames.has(index.name))
    .map((index) => {
      return { ...index, compassIndexType: 'regular-index' };
    });

  const mappedInProgressIndexes: MappedInProgressIndex[] =
    inProgressIndexes.map((index) => {
      return { ...index, compassIndexType: 'in-progress-index' };
    });

  const mappedRollingIndexes: MappedRollingIndex[] = rollingIndexes.map(
    (index) => {
      return {
        ...index,
        compassIndexType: 'rolling-index',
        fields: index.keys.map((k) => ({ field: k.name, value: k.value })),
      };
    }
  );

  return [
    ...mappedIndexes,
    ...mappedInProgressIndexes,
    ...mappedRollingIndexes,
  ];
}

function getInProgressIndexInfo(
  index: MappedInProgressIndex,
  {
    onDeleteFailedIndexClick,
  }: {
    onDeleteFailedIndexClick: (indexName: string) => void;
  }
): CommonIndexInfo {
  return {
    id: index.id,
    name: index.name,
    indexInfo: index,
    type: <TypeField type="unknown" />,
    size: <SizeField size={0} relativeSize={0} />,
    usageCount: <UsageField usage={undefined} since={undefined} />,
    // TODO(COMPASS-8335): add properties for in-progress indexes
    properties: null,
    status: <StatusField status={index.status} error={index.error} />,
    actions: (
      <IndexActions
        index={index}
        onDeleteFailedIndexClick={onDeleteFailedIndexClick}
      />
    ),
  };
}

function getRollingIndexInfo(index: MappedRollingIndex): CommonIndexInfo {
  return {
    id: `rollingIndex-${index.indexName}`,
    name: index.indexName,
    indexInfo: index,
    // TODO(COMPASS-8335): check that label really is a regular index type
    type: <TypeField type={index.indexType.label as RegularIndex['type']} />,
    size: <SizeField size={0} relativeSize={0} />,
    usageCount: <UsageField usage={undefined} since={undefined} />,
    // TODO(COMPASS-7589): add properties for rolling indexes
    properties: null,
    status: <StatusField status="building" />,
    actions: null, // Rolling indexes don't have actions
  };
}

function getRegularIndexInfo(
  index: MappedRegularIndex,
  {
    serverVersion,
    onHideIndexClick,
    onUnhideIndexClick,
    onDeleteIndexClick,
  }: {
    serverVersion: string;
    onHideIndexClick: (indexName: string) => void;
    onUnhideIndexClick: (indexName: string) => void;
    onDeleteIndexClick: (indexName: string) => void;
  }
): CommonIndexInfo {
  const status = determineRegularIndexStatus(index);

  return {
    id: index.name,
    name: index.name,
    indexInfo: index,
    type: <TypeField type={index.type} extra={index.extra} />,
    size: <SizeField size={index.size} relativeSize={index.relativeSize} />,
    usageCount: (
      <UsageField usage={index.usageCount} since={index.usageSince} />
    ),
    properties: (
      <PropertyField
        cardinality={index.cardinality}
        extra={index.extra}
        properties={index.properties}
      />
    ),
    status: <StatusField status={status} />,
    actions: index.name !== '_id_' && (
      <IndexActions
        index={index}
        serverVersion={serverVersion}
        onDeleteIndexClick={onDeleteIndexClick}
        onHideIndexClick={onHideIndexClick}
        onUnhideIndexClick={onUnhideIndexClick}
      />
    ),
  };
}

export type UseRegularIndexesTableProps = {
  indexes: RegularIndex[];
  inProgressIndexes: InProgressIndex[];
  rollingIndexes: RollingIndex[];
  serverVersion: string;
  onHideIndexClick: (name: string) => void;
  onUnhideIndexClick: (name: string) => void;
  onDeleteIndexClick: (name: string) => void;
  onDeleteFailedIndexClick: (name: string) => void;
};

export function useRegularIndexesTable({
  indexes,
  inProgressIndexes,
  rollingIndexes,
  serverVersion,
  onHideIndexClick,
  onUnhideIndexClick,
  onDeleteIndexClick,
  onDeleteFailedIndexClick,
}: UseRegularIndexesTableProps) {
  const allIndexes: MergedIndex[] = mergeIndexes(
    indexes,
    inProgressIndexes,
    rollingIndexes
  );

  const data = useMemo<LGTableDataType<IndexInfo>[]>(
    () =>
      allIndexes.map((index) => {
        let indexData: CommonIndexInfo;
        if (index.compassIndexType === 'in-progress-index') {
          indexData = getInProgressIndexInfo(index, {
            onDeleteFailedIndexClick,
          });
        } else if (index.compassIndexType === 'rolling-index') {
          indexData = getRollingIndexInfo(index);
        } else {
          indexData = getRegularIndexInfo(index, {
            serverVersion,
            onDeleteIndexClick,
            onHideIndexClick,
            onUnhideIndexClick,
          });
        }

        return {
          ...indexData,
          renderExpandedContent() {
            return (
              <IndexKeysBadge
                keys={index.fields}
                data-testid={`indexes-details-${indexData.name}`}
              />
            );
          },
        };
      }),
    [
      allIndexes,
      onDeleteIndexClick,
      onDeleteFailedIndexClick,
      onHideIndexClick,
      onUnhideIndexClick,
      serverVersion,
    ]
  );

  return { data };
}
