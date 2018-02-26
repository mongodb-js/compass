import DocumentTransform from './document-transform';
import FILE_TYPES from 'constants/file-types';

export default function exportCollection(ds, name, query, type = FILE_TYPES.JSON) {
  const cursor = ds.fetch(name, query.filter || {});
  const docTransform = new DocumentTransform(type);
  cursor.rewind();

  cursor.pipe(docTransform);
  return { cursor, docTransform };
}
