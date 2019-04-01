import StandardEditor from './standard';
import StringEditor from './string';
import Decimal128Editor from './decimal128';
import Int32Editor from './int32';
import DoubleEditor from './double';
import DateEditor from './date';
import NullEditor from './null';
import UndefinedEditor from './undefined';
import ObjectIdEditor from './objectid';

const init = (element, tz) => {
  return {
    'Standard': new StandardEditor(element),
    'String': new StringEditor(element),
    'Decimal128': new Decimal128Editor(element),
    'Date': new DateEditor(element, tz),
    'Double': new DoubleEditor(element),
    'Int32': new Int32Editor(element),
    'Null': new NullEditor(element),
    'Undefined': new UndefinedEditor(element),
    'ObjectId': new ObjectIdEditor(element)
  };
};

export default init;
export {
  DateEditor,
  StandardEditor,
  StringEditor,
  Decimal128Editor,
  DoubleEditor,
  Int32Editor,
  NullEditor,
  UndefinedEditor,
  ObjectIdEditor
};
