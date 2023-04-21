import Document, { Events as DocumentEvents } from './document';
import Element, {
  Events as ElementEvents,
  isInternalFieldPath,
} from './element';
import ElementEditor from './editor';
import type { Editor } from './editor';
import { getDefaultValueForType, objectToIdiomaticEJSON } from './utils';

export default Document;
export type { Editor };
export {
  Document,
  DocumentEvents,
  Element,
  ElementEvents,
  ElementEditor,
  isInternalFieldPath,
  getDefaultValueForType,
  objectToIdiomaticEJSON,
};
