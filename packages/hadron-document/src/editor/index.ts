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
import type Element from '../element';

const init = (element: Element) => ({
  Standard: new StandardEditor(element),
  String: new StringEditor(element),
  Decimal128: new Decimal128Editor(element),
  Date: new DateEditor(element),
  Double: new DoubleEditor(element),
  Int32: new Int32Editor(element),
  Int64: new Int64Editor(element),
  Null: new NullEditor(element),
  Undefined: new UndefinedEditor(element),
  ObjectId: new ObjectIdEditor(element),
});

export default Object.assign(init, {
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
  | ObjectIdEditor;

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
};
