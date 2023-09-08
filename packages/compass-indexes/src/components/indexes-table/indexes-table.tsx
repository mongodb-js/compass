import React, { useRef, useEffect } from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  KeylineCard,
  Table,
  TableHeader,
  Row,
  Cell,
  useDOMRect,
} from '@mongodb-js/compass-components';

const tableStyles = css({
  thead: {
    position: 'sticky',
    top: 0,
    background: palette.white,
    zIndex: 5,
  },
});

const cardStyles = css({
  padding: spacing[3],
});

const spaceProviderStyles = css({
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
});

export type IndexesTableProps<Shape> = {
  'data-testid': string;
  'aria-label': string;
  columns: JSX.Element[];
  children: (args: { datum: Shape; index: number }) => JSX.Element;
  data: Shape[];
};

export function IndexesTable<Shape>({
  ['data-testid']: dataTestId,
  ['aria-label']: ariaLabel,
  columns,
  children,
  data,
}: IndexesTableProps<Shape>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rectProps, { height: availableHeightInContainer }] = useDOMRect();

  useEffect(() => {
    /**
     * For table header to be sticky, the wrapper element of table needs to have
     * a height. LG wraps table in a div at multiple levels, so height can not
     * be applied directly to the wrapper we have in this markup which is why we
     * look for the parent element to apply the height.
     */
    const table = cardRef.current?.getElementsByTagName('table')[0];
    const tableParent = table?.parentElement;

    if (table && tableParent) {
      // We add a top and bottom padding of spacing[3] and our root container
      // has a bottom margin of spacing[3] which is why the actual usable
      // height of the container is less than what we get here
      const heightWithoutSpacing = availableHeightInContainer - spacing[3] * 3;

      // This will be the height of the table. We take whichever is the max of
      // the actual table height vs the half of the height available to make
      // sure that our table does not always render in a super small keyline
      // card when there are only a few rows in the table.
      const tableHeight = Math.max(
        table.clientHeight,
        heightWithoutSpacing / 2
      );

      // When we have enough space available to render the table, we simply want
      // our keyline card to have a height as much as that of the table content
      const tableParentHeight = Math.max(
        0,
        Math.min(tableHeight, heightWithoutSpacing)
      );
      tableParent.style.height = `${tableParentHeight}px`;
    }
  }, [availableHeightInContainer]);

  return (
    <div className={spaceProviderStyles} {...rectProps}>
      <KeylineCard
        ref={cardRef}
        data-testid={dataTestId}
        className={cardStyles}
      >
        <Table<Shape>
          className={tableStyles}
          data={data}
          columns={columns}
          data-testid={`${dataTestId}-list`}
          aria-label={`${ariaLabel} List Table`}
        >
          {children}
        </Table>
      </KeylineCard>
    </div>
  );
}

// When row is hovered, we show the delete button
const rowStyles = css({
  ':hover': {
    '.index-actions-field': {
      button: {
        opacity: 1,
      },
    },
  },
});

// When row is not hovered, we hide the delete button
const indexActionsFieldStyles = css({
  button: {
    opacity: 0,
    '&:focus': {
      opacity: 1,
    },
  },
  minWidth: spacing[5],
});

const tableHeaderStyles = css({
  borderWidth: 0,
  borderBottomWidth: 3,
  '> div': {
    justifyContent: 'space-between',
  },
});

const cellStyles = css({
  verticalAlign: 'middle',
});

const nestedRowCellStyles = css({
  padding: 0,
});

export function IndexRow({
  children,
  ...props
}: React.ComponentProps<typeof Row>) {
  return (
    <Row {...props} className={rowStyles}>
      {children}
    </Row>
  );
}
export function IndexCell({
  children,
  ...props
}: React.ComponentProps<typeof Cell>) {
  return (
    <Cell {...props} className={cellStyles}>
      {children}
    </Cell>
  );
}

export function IndexHeader({
  ...props
}: React.ComponentProps<typeof TableHeader>) {
  return <TableHeader {...props} className={tableHeaderStyles} />;
}
export function IndexActionsField({ children }: { children: React.ReactNode }) {
  return (
    <div className={cx(indexActionsFieldStyles, 'index-actions-field')}>
      {children}
    </div>
  );
}
export function IndexKeys({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <Row>
      <Cell colSpan={colSpan} className={cx(nestedRowCellStyles, cellStyles)}>
        {children}
      </Cell>
    </Row>
  );
}
