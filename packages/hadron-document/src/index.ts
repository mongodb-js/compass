import Document, {
  Events as DocumentEvents,
  DEFAULT_VISIBLE_ELEMENTS as DEFAULT_VISIBLE_DOCUMENT_ELEMENTS,
} from './document';
import Element, {
  Events as ElementEvents,
  isInternalFieldPath,
  DEFAULT_VISIBLE_ELEMENTS,
} from './element';
import ElementEditor from './editor';
import type { Editor } from './editor';
import { getDefaultValueForType, objectToIdiomaticEJSON } from './utils';

export default Document;
export type { Editor };
export {
  Document,
  DocumentEvents,
  DEFAULT_VISIBLE_DOCUMENT_ELEMENTS,
  Element,
  ElementEvents,
  DEFAULT_VISIBLE_ELEMENTS,
  ElementEditor,
  isInternalFieldPath,
  getDefaultValueForType,
  objectToIdiomaticEJSON,
};
