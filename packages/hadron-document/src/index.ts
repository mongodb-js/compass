import Document, { Events as DocumentEvents } from './document';
import Element, {
  Events as ElementEvents,
  isInternalFieldPath,
} from './element';
import ElementEditor from './editor';
import type { Editor } from './editor';

export default Document;
export type { Editor };
export {
  Document,
  DocumentEvents,
  Element,
  ElementEvents,
  ElementEditor,
  isInternalFieldPath,
};
