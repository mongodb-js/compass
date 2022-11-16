import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Body,
  BSONValue,
  Button,
  Card,
  Cell,
  css,
  cx,
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
        index: i + 1,
        doc,
        isModified: columns.reduce(
          (acc, curr) => !!(acc && doc.get(curr.key)?.isRevertable()),
          false
        ),
        cells: columns.map(({ key }) => {
          return {
            key: key,
            element: doc.get(key),
          };
        }),
      })),
    [columns, docs]
  );

  const headers = useMemo(() => {
    const headerDefs = [
      { key: '#', type: '' },
      ...columns,
      { key: '', type: '' },
    ];
    return headerDefs.map(({ key, type }, i) => {
      return (
        <TableHeader
          className={cx(
            headerStyle,
            i === 0 || i === headerDefs.length - 1
              ? css({
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'inherit',
                })
              : ''
          )}
          label={<ColumnHeader name={key} type={type} />}
          key={key}
        />
      );
    });
  }, [columns]);

  return (
    <div>
      <Table className={css({ width: '100%' })} data={rows} columns={headers}>
        {({ datum: row }) => (
          <Row key={row.index} data-testid={`row-${row.index}`}>
            <Cell className={css({ position: 'sticky', left: 0 })}>
              {row.index}
            </Cell>
            {row.cells.map(({ element, key }) => (
              <Cell key={key}>
                {element && (
                  <TableCellContent element={element}></TableCellContent>
                )}
              </Cell>
            ))}
            <Cell className={css({ position: 'sticky', right: 0 })}>
              {row.doc.isModified() && (
                <>
                  <Button>Update</Button>
                  <Button>Cancel</Button>
                </>
              )}
            </Cell>
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
      {element.isRevertable() ? 'Modified' : ''}

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
