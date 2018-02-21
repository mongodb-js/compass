import DocumentTransform from './document-transform';
import FILE_TYPES from 'constants/file-types';

export default function exportCollection(ds, name, type = FILE_TYPES.JSON) {
  const cursor = ds.fetch(name, {});
  const docTransform = new DocumentTransform(type);
  cursor.rewind();

  cursor.pipe(docTransform);
  return { cursor, docTransform };
}
