import { Document } from './document';
export default Document;
export {
  Document,
  DEFAULT_VISIBLE_ELEMENTS as DEFAULT_VISIBLE_DOCUMENT_ELEMENTS,
} from './document';
export { DocumentEvents, type DocumentEventsType } from './document-events';

export {
  Element,
  isInternalFieldPath,
  DEFAULT_VISIBLE_ELEMENTS,
} from './element';
export { ElementEvents, type ElementEventsType } from './element-events';

export { ElementEditor, type Editor } from './editor';

export {
  getDefaultValueForType,
  objectToIdiomaticEJSON,
  type BSONValue,
} from './utils';
