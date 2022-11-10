import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Body,
  BSONValue,
  Card,
  Cell,
  css,
  DocumentList,
  palette,
  Popover,
  Row,
  Table,
  TableHeader,
  useId,
} from '@mongodb-js/compass-components';
import type Document from 'hadron-document';
import type { Element } from 'hadron-document';

type DocumentTableViewProps = {
  docs: Document[];
};

function getColumnsFromDocs(docs: Document[]) {
  const columns: Record<string, string> = {};

  for (const doc of docs) {
    for (const { key, type } of doc.elements) {
      columns[key] ??= type;

      if (type !== columns[key]) {
        columns[key] = 'Mixed';
      }
    }
  }

  return Object.entries(columns).map(([key, type]) => ({
    key,
    type,
  }));
}

const textStyle = css({
  textAlign: 'center',
  fontSize: 11,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '& .element-value': {
    whiteSpace: 'nowrap',
  },
});

const headerStyle = css({
  ':hover': {
    backgroundColor: palette.gray.light2,
    cursor: 'grab',
  },
});

type ColumnHeaderProps = {
  name: string;
  type: string;
};

const ColumnHeader: React.FunctionComponent<ColumnHeaderProps> = ({
  name,
  type,
}) => (
  <Body draggable as="div" className={textStyle}>
    <b>{name}</b> {type}
  </Body>
);

const DocumentTableView: React.FunctionComponent<DocumentTableViewProps> = ({
  docs,
}) => {
  const columns = useMemo(() => {
    return getColumnsFromDocs(docs);
  }, [docs]);

  const rows = useMemo(
    () =>
      docs.map((doc, i) => ({
        index: i,
        doc,
        cells: columns.map(({ key }) => {
          return {
            key: key,
            element: doc.get(key),
          };
        }),
      })),
    [columns, docs]
  );

  const headers = useMemo(
    () =>
      columns.map(({ key, type }) => {
        return (
          <TableHeader
            className={headerStyle}
            label={<ColumnHeader name={key} type={type} />}
            key={key}
          />
        );
      }),
    [columns]
  );

  return (
    <div>
      <Table data={rows} columns={headers}>
        {({ datum: row }) => (
          <Row key={row.index} data-testid={`row-${row.index}`}>
            {row.cells.map(({ element, key }) => (
              <Cell key={key}>
                {element && (
                  <TableCellContent element={element}></TableCellContent>
                )}
              </Cell>
            ))}
          </Row>
        )}
      </Table>
    </div>
  );
};

const TableCellContent = ({ element }: { element: Element }) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [editingEnabled, setEditingEnabled] = useState<boolean>();
  const popoverId = useId();

  useEffect(() => {
    function handleClickOutside(event: any) {
      console.log('handleClickOutside', document.getElementById(popoverId));

      if (
        !cellRef.current?.contains(event.target) &&
        !document.getElementById(popoverId)?.contains(event.target)
      ) {
        setEditingEnabled(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cellRef, popoverId]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={cellRef}
      onClick={() => setEditingEnabled(true)}
      role="cell"
      className={textStyle}
    >
      <BSONValue
        type={element.currentType}
        value={element.currentValue}
      ></BSONValue>

      <Popover usePortal active={editingEnabled}>
        <Card id={popoverId}>
          <DocumentList.HadronElement
            value={element}
            editable={true}
            editingEnabled={true}
            allExpanded={false}
            onEditStart={() => {}}
            lineNumberSize={0}
            valueOnly
            hideControlsWhileNotEditing
            onAddElement={(el) => {}}
          ></DocumentList.HadronElement>
        </Card>
      </Popover>
    </div>
  );
};

export default DocumentTableView;
