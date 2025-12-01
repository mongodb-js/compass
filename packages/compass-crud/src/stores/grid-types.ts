import type { TypeCastTypes } from 'hadron-type-checker';

export type TableHeaderType = TypeCastTypes | 'Mixed';

export interface GridActions {
  addColumn(
    newColId: string,
    columnBefore: string,
    rowIndex: number,
    path: (string | number)[],
    isArray: boolean,
    editOnly: boolean,
    oid: string
  ): void;
  removeColumn(colId: string): void;
  renameColumn(oldColId: string, newColId: string): void;
  elementAdded(key: string, type: TableHeaderType, oid: string): void;
  elementRemoved(key: string, oid: string, isArray: boolean): void;
  elementTypeChanged(key: string, type: TableHeaderType, oid: string): void;
  elementMarkRemoved(key: string, oid: string): void;
  resetColumns(columns: Record<string, Record<string, TableHeaderType>>): void;
  cleanCols(): void;
  replaceDoc(oldOid: string, newOid: string, newDoc: any): void;
}

export type GridStoreTriggerParams = {
  refresh?: { oid: string };
  add?: {
    colIdBefore: string;
    newColId: string;
    colType: TableHeaderType | '';
    path: (string | number)[];
    isArray: boolean;
  };
  updateHeaders?: { showing: Record<string, TableHeaderType> };
  remove?: { colIds: string[] };
  edit?: {
    colId: string;
    rowIndex: number;
  };
};
