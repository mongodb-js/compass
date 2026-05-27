import StandardEditor from './standard';
import StringEditor from './string';
import Decimal128Editor from './decimal128';
import Int32Editor from './int32';
import Int64Editor from './int64';
import DoubleEditor from './double';
import DateEditor from './date';
import NullEditor from './null';
import UndefinedEditor from './undefined';
import ObjectIdEditor from './objectid';
import UUIDEditor from './uuid';
import type { Element } from '../element';
import { type TypeCastTypes } from 'hadron-type-checker';

const init = (element: Element, displayType?: TypeCastTypes) => ({
  Standard: new StandardEditor(element, displayType),
  String: new StringEditor(element, displayType),
  Decimal128: new Decimal128Editor(element, displayType),
  Date: new DateEditor(element, displayType),
  Double: new DoubleEditor(element, displayType),
  Int32: new Int32Editor(element, displayType),
  Int64: new Int64Editor(element, displayType),
  Null: new NullEditor(element, displayType),
  Undefined: new UndefinedEditor(element, displayType),
  ObjectId: new ObjectIdEditor(element, displayType),
  UUID: new UUIDEditor(element, displayType),
});

export const ElementEditor = Object.assign(init, {
  DateEditor,
  StandardEditor,
  StringEditor,
  Decimal128Editor,
  DoubleEditor,
  Int32Editor,
  Int64Editor,
  NullEditor,
  UndefinedEditor,
  ObjectIdEditor,
  UUIDEditor,
});

export type Editor =
  | DateEditor
  | StandardEditor
  | StringEditor
  | Decimal128Editor
  | DoubleEditor
  | Int32Editor
  | Int64Editor
  | NullEditor
  | UndefinedEditor
  | ObjectIdEditor
  | UUIDEditor;

export {
  DateEditor,
  StandardEditor,
  StringEditor,
  Decimal128Editor,
  DoubleEditor,
  Int32Editor,
  Int64Editor,
  NullEditor,
  UndefinedEditor,
  ObjectIdEditor,
  UUIDEditor,
};

export function getEditorNameByType(type: TypeCastTypes) {
  switch (type) {
    case 'Date':
    case 'String':
    case 'Decimal128':
    case 'Double':
    case 'Int32':
    case 'Int64':
    case 'Null':
    case 'Undefined':
    case 'ObjectId':
      return type;
    case 'UUID':
    case 'LegacyJavaUUID':
    case 'LegacyCSharpUUID':
    case 'LegacyPythonUUID':
      return 'UUID';
    default:
      return 'Standard';
  }
}

export function getEditorByType(type: TypeCastTypes) {
  const editorName = getEditorNameByType(type);
  return ElementEditor[`${editorName}Editor`];
}
