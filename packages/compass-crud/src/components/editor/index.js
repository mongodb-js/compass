import StandardEditor from './standard';
import StringEditor from './string';
import Int32Editor from './int32';
import DoubleEditor from './double';
import DateEditor from './date';
import NullEditor from './null';
import UndefinedEditor from './undefined';
import ObjectIdEditor from './objectid';

const init = (element) => {
  return {
    'Standard': new StandardEditor(element),
    'String': new StringEditor(element),
    'Date': new DateEditor(element),
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
  DoubleEditor,
  Int32Editor,
  NullEditor,
  UndefinedEditor,
  ObjectIdEditor
};
