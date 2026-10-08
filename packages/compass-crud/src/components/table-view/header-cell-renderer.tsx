import React from 'react';
import { Translated, cx } from '@mongodb-js/compass-components';
import type { TableHeaderType } from '../../stores/grid-store';

export type HeaderCellRendererProps = {
  displayName: string;
  bsonType: TableHeaderType;
  hide?: boolean;
  subtable?: boolean;
};

/**
  Custom cell renderer for the headers.
 */
class HeaderCellRenderer extends React.Component<HeaderCellRendererProps> {
  constructor(props: HeaderCellRendererProps) {
    super(props);
  }

  refresh() {
    return true;
  }

  render() {
    if (this.props.hide) {
      return null;
    }
    const displayName =
      this.props.displayName === '$new' ? (
        <Translated id="crud.tableView.newField">New Field</Translated>
      ) : (
        this.props.displayName
      );
    return (
      <div
        className={cx('table-view-cell-header', {
          'table-view-cell-header-subtable-objectid':
            this.props.subtable === true,
        })}
      >
        <b>{displayName}</b> {this.props.bsonType}
      </div>
    );
  }

  static displayName = 'HeaderCellRenderer';
}

export default HeaderCellRenderer;
