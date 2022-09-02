import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  css,
  Table,
  TableHeader,
  Row,
  Cell,
  cx,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import type AppRegistry from 'hadron-app-registry';

import NameField from './name-field';
import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import DropField from './drop-field';
import type {
  IndexDefinition,
  SortColumn,
  SortDirection,
} from '../../modules/indexes';

// When row is hovered, we show the delete button
const rowStyles = css({
  ':hover': {
    '.delete-cell': {
      button: {
        opacity: 1,
      },
    },
  },
});
// When row is not hovered, we hide the delete button
const deleteFieldStyles = css({
  button: {
    opacity: 0,
    '&:focus': {
      opacity: 1,
    },
  },
});

const tableHeaderStyles = css({
  borderWidth: 0,
  borderBottomWidth: 3,
  '> div': {
    justifyContent: 'space-between',
  },
});

const cellStyles = css({
  verticalAlign: 'top',
});

const nameFieldStyles = css({
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
});

const tableStyles = css({
  thead: {
    position: 'sticky',
    top: 0,
    background: uiColors.white,
    zIndex: 1,
  },
});

type IndexesTableProps = {
  indexes: IndexDefinition[];
  canDeleteIndex: boolean;
  onSortTable: (column: SortColumn, direction: SortDirection) => void;
  onDeleteIndex: (name: string) => void;
  globalAppRegistry: AppRegistry;
};

const getContainerHeight = (
  containerRef: React.RefObject<HTMLDivElement>
): string => {
  const height =
    containerRef.current?.parentElement?.parentElement?.clientHeight;
  if (!height) {
    // 320px for the compass tabs, collection info etc
    return `${window.innerHeight - 320}px`;
  }
  return `${height - 78}px`;
};

export const IndexesTable: React.FunctionComponent<IndexesTableProps> = ({
  indexes,
  canDeleteIndex,
  globalAppRegistry,
  onSortTable,
  onDeleteIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(
    getContainerHeight(containerRef)
  );
  const columns = useMemo(() => {
    const sortColumns: SortColumn[] = [
      'Name and Definition',
      'Type',
      'Size',
      'Usage',
      'Properties',
    ];
    const _columns = sortColumns.map((name) => {
      return (
        <TableHeader
          data-testid={`index-header-${name}`}
          label={name}
          key={name}
          className={tableHeaderStyles}
          handleSort={(direction) => {
            onSortTable(name, direction);
          }}
        />
      );
    });
    // The delete column
    if (canDeleteIndex) {
      _columns.push(<TableHeader label={''} className={tableHeaderStyles} />);
    }
    return _columns;
  }, [canDeleteIndex, onSortTable]);

  useEffect(() => {
    const container =
      containerRef.current?.getElementsByTagName('table')[0]?.parentElement;
    if (container) {
      container.style.height = containerHeight;
    }
  }, [containerRef, containerHeight]);

  useEffect(() => {
    globalAppRegistry.on('compass:compass-shell:resized', () => {
      setContainerHeight(getContainerHeight(containerRef));
    });
  }, [globalAppRegistry, containerRef]);

  useEffect(() => {
    const resizeListener = () => {
      setContainerHeight(getContainerHeight(containerRef));
    };
    window.addEventListener('resize', resizeListener);
    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, [containerRef]);

  return (
    // LG table does not forward ref
    <div ref={containerRef}>
      <Table
        className={tableStyles}
        data={indexes}
        columns={columns}
        data-testid="indexes-list"
        aria-label="Indexes List Table"
      >
        {({ datum: index }) => (
          <Row
            key={index.name}
            data-testid={`index-row-${index.name}`}
            className={rowStyles}
          >
            <Cell data-testid="index-name-field" className={cellStyles}>
              <div className={nameFieldStyles}>
                <NameField name={index.name} keys={index.fields.serialize()} />
              </div>
            </Cell>
            <Cell data-testid="index-type-field" className={cellStyles}>
              <TypeField type={index.type} extra={index.extra} />
            </Cell>
            <Cell data-testid="index-size-field" className={cellStyles}>
              <SizeField size={index.size} relativeSize={index.relativeSize} />
            </Cell>
            <Cell data-testid="index-usage-field" className={cellStyles}>
              <UsageField usage={index.usageCount} since={index.usageSince} />
            </Cell>
            <Cell data-testid="index-property-field" className={cellStyles}>
              <PropertyField
                cardinality={index.cardinality}
                extra={index.extra}
                properties={index.properties}
              />
            </Cell>
            {/* Delete column is conditional */}
            {index.name !== '_id_' && canDeleteIndex && (
              <Cell data-testid="index-drop-field" className={cellStyles}>
                <div className={cx(deleteFieldStyles, 'delete-cell')}>
                  <DropField
                    name={index.name}
                    onDelete={() => onDeleteIndex(index.name)}
                  />
                </div>
              </Cell>
            )}
          </Row>
        )}
      </Table>
    </div>
  );
};
